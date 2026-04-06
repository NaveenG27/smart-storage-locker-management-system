from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from .models import Locker, Reservation
from .serializers import LockerSerializer, ReservationSerializer, UserSerializer
from rest_framework.exceptions import ValidationError

# --- FIREBASE REAL-TIME IMPORTS ---
import firebase_admin
from firebase_admin import credentials, db
import datetime
import os

# Initialize Firebase Admin SDK
# Note: Ensure your serviceAccountKey.json is in your backend folder
try:
    if not firebase_admin._apps:
        # Use an environment variable for the path to keep it flexible for Render deployment
        cred_path = os.getenv('FIREBASE_JSON_PATH', 'serviceAccountKey.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://your-project-id-default-rtdb.firebaseio.com/' 
        })
except Exception as e:
    print(f"Firebase Initialization Error: {e}")

def trigger_realtime_sync():
    """
    Updates a timestamp in Firebase Realtime Database.
    All connected React clients listen to this path and refresh when it changes.
    """
    try:
        ref = db.reference('locker_sync')
        ref.set({
            'last_update': str(datetime.datetime.now().timestamp())
        })
    except Exception as e:
        print(f"Firebase Sync Error: {e}")

User = get_user_model()

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        name = request.data.get('name')

        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username, 
            email=email, 
            password=password,
            name=name
        )
        return Response({'message': 'User created successfully!'}, status=status.HTTP_201_CREATED)

class LockerViewSet(viewsets.ModelViewSet):
    """
    Handles List, Create, Update, and Delete for Lockers[cite: 27, 28, 30, 31].
    """
    queryset = Locker.objects.all()
    serializer_class = LockerSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class ReservationViewSet(viewsets.ModelViewSet):
    """
    Handles Locker Reservations[cite: 33, 34].
    """
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Reservation.objects.all().order_by('-reserved_at')
        return Reservation.objects.filter(user=self.request.user).order_by('-reserved_at')

    def perform_create(self, serializer):
        locker = serializer.validated_data['locker']
        
        if locker.status != 'available':
            raise ValidationError({'error': 'Locker is already occupied'})
        
        # Update locker status to occupied [cite: 18]
        locker.status = 'occupied'
        locker.save()
        
        # Save the reservation
        serializer.save(user=self.request.user)
        
        # Trigger real-time sync for other users
        trigger_realtime_sync()

    @action(detail=True, methods=['put'])
    def release(self, request, pk=None):
        """
        Custom action to release a locker[cite: 36].
        """
        reservation = self.get_object()
        locker = reservation.locker
        
        if not request.user.is_staff and reservation.user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if not reservation.is_active:
            return Response({'error': 'Reservation is already inactive'}, status=status.HTTP_400_BAD_REQUEST)

        # Update locker status back to available [cite: 18]
        locker.status = 'available'
        locker.save()
        
        # Deactivate the reservation
        reservation.is_active = False
        reservation.save()
        
        # Trigger real-time sync for other users
        trigger_realtime_sync()
        
        return Response({'status': 'locker released', 'locker_number': locker.locker_number})