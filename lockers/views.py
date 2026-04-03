from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from .models import Locker, Reservation
from .serializers import LockerSerializer, ReservationSerializer, UserSerializer

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
    queryset = Locker.objects.all()
    serializer_class = LockerSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Reservation.objects.all().order_by('-reserved_at')
        return Reservation.objects.filter(user=self.request.user).order_by('-reserved_at')

    def perform_create(self, serializer):
        locker = serializer.validated_data['locker']
        
        if locker.status != 'available':
            # Note: In perform_create, it's better to raise a ValidationError
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Locker is already occupied'})
        
        locker.status = 'occupied'
        locker.save()
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['put'])
    def release(self, request, pk=None):
        reservation = self.get_object()
        locker = reservation.locker
        
        if not request.user.is_staff and reservation.user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if not reservation.is_active:
            return Response({'error': 'Reservation is already inactive'}, status=status.HTTP_400_BAD_REQUEST)

        locker.status = 'available'
        locker.save()
        reservation.is_active = False
        reservation.save()
        return Response({'status': 'locker released', 'locker_number': locker.locker_number})