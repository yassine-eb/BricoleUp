from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from app.models import Announcement, Profile, Skill, City, Review, FavoriteProfile
import requests as http_requests
from rest_framework.decorators import api_view as _geo_view

@_geo_view(['GET'])
def geo_city(request):
    try:
        res = http_requests.get('https://ipwho.is/', timeout=4)
        data = res.json()
        return Response({'city': data.get('city', ''), 'region': data.get('region', '')})
    except Exception:
        return Response({'city': '', 'region': ''})

from app.api.serializers import AnnouncementSerializer, ProfileSerializer, SkillSerializer, CitySerializer, PrestataireListSerializer
from django.shortcuts import get_object_or_404


from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import *

from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from app.models import Profile

from django.db.models import Avg, Count

@api_view(['POST'])
def jwt_login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Email ou mot de passe invalide"}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(username=user.username, password=password)
    if user is None:
        return Response({"error": "Email ou mot de passe invalide"}, status=status.HTTP_401_UNAUTHORIZED)

    profile, _ = Profile.objects.get_or_create(user=user)

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "username": user.username,
        "email": user.email,
        "admin": user.is_staff,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "slug": user.profile.slug,
            'profile_picture_url': profile.profile_picture.url if profile.profile_picture else None,
        }
    })


@api_view(['POST'])
def jwt_register(request):
    email        = request.data.get("email", "").strip()
    password     = request.data.get("password", "").strip()
    password2    = request.data.get("password2", "").strip()
    nom          = request.data.get("nom", "").strip()
    prenom       = request.data.get("prenom", "").strip()
    phone_number = request.data.get("phone_number", "").strip()
    role         = request.data.get("role", "client")  # 'client' ou 'prestataire'

    if not email or not password:
        return Response({"error": "Email et mot de passe obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    if password2 and password != password2:
        return Response({"password": ["Les mots de passe ne correspondent pas."]}, status=status.HTTP_400_BAD_REQUEST)

    if len(password) < 8:
        return Response({"password": ["Le mot de passe doit contenir au moins 8 caractères."]}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"email": ["Un compte existe déjà avec cet email."]}, status=status.HTTP_400_BAD_REQUEST)

    if phone_number and Profile.objects.filter(phone_number=phone_number).exists():
        return Response({"error": "Ce numéro de téléphone est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)

    # Username : fourni ou généré depuis l'email
    username = request.data.get("username", "").strip()
    if not username:
        base = email.split("@")[0].lower().replace(".", "_").replace("+", "_")
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
    elif User.objects.filter(username=username).exists():
        return Response({"error": "Ce nom d'utilisateur est déjà pris."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.first_name = prenom
    user.last_name = nom
    user.save()

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.prenom = prenom
    profile.nom = nom
    profile.type = "towork" if role == "prestataire" else "tohire"
    if phone_number:
        profile.phone_number = phone_number
    profile.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "slug": profile.slug,
            "profile_picture_url": None,
        }
    }, status=status.HTTP_201_CREATED)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class UserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

# from django.contrib.gis.geoip2 import GeoIP2  # requires GDAL system libs
def get_client_ip(request):
    """Gets the real client IP address, even behind reverse proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class HomeAPI(APIView):
    def get(self, request):

        country_code = request.GET.get("country")
        try:
            country =  Country.objects.get(code=country_code)
        except Exception as e:
            country = Country.objects.get(code="FR")

        latest_demandes = Announcement.objects.filter(category__name_fr="Demande de prestation", city__country = country).order_by('-created_at')[:3]
        latest_offres = Announcement.objects.filter(category__name_fr="Offre de services", city__country = country).order_by('-created_at')[:3]
        latest_projects = Project.objects.filter(user__profile__city__country = country).order_by('-created_at')[:4]
        latest_annonce = (
            Announcement.objects.filter(city__country=country)
            .select_related('created_by__profile', 'category', 'city')
            .order_by('-created_at')
            .first()
        )





        data = {
            'latest_demandes': AnnouncementSerializer(latest_demandes, many=True).data,
            'latest_offres': AnnouncementSerializer(latest_offres, many=True).data,
            'latest_projects': ProjectSerializer(latest_projects, many=True).data,
            'latest_annonce': AnnouncementSerializer(latest_annonce).data if latest_annonce else None,
        }

        return Response(data)

class ProjectDetailAPI(APIView):
    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)



class AnnouncementDetailAPI(APIView):
    def get(self, request, pk):
        annonce = get_object_or_404(Announcement, pk=pk)
        serializer = AnnouncementSerializer(annonce)
        return Response(serializer.data, status=status.HTTP_200_OK)

from django.db.models import Case, When
class AnnouncementsAPI(APIView):
    def get(self, request):
        # Get query parameters
        skills_param = request.GET.get('skills', '')
        city_param = request.GET.get('city', '')
        sort_by = request.GET.get('sort_by', 'date')
        account_type = request.GET.getlist('account_type', [])
        verified = request.GET.get('verified', 'false').lower() == 'true'
        search_radius = request.GET.get('search_radius', '50')


        CATEGORY_MAP = {
            "demande_prestation": "Demande de prestation",
            "offre_service": "Offre de services",
            "vente_materiel": "Vente de matériel",
            "location_materiel": "Location de matériel",
        }

        categories_keys = request.GET.getlist('categories', [])
        categories_name_fr = [CATEGORY_MAP[key] for key in categories_keys if key in CATEGORY_MAP]



        try:
            search_radius = float(search_radius)
        except ValueError:
            search_radius = 50

        


        # Base queryset — all announcements visible publicly
        queryset = Announcement.objects.select_related(
            'created_by__profile', 'category', 'city'
        ).prefetch_related('skills')
        country_code = request.GET.get("country")
        try:
            country =  Country.objects.get(code=country_code)
        except Exception as e:
            country = Country.objects.get(code="FR")
        queryset = queryset.filter(city__country=country)

        if categories_name_fr:
            queryset = queryset.filter(category__name_fr__in=categories_name_fr)
        # Filter by skills
        if skills_param:
            skill_ids = [int(sid) for sid in skills_param.split(',') if sid]
            if skill_ids:
                queryset = queryset.filter(skills__id__in=skill_ids).distinct()

        # Filter by city
        

        if city_param:
            try:
                city_id = int(city_param)
                city_obj = City.objects.get(id=city_id)

                announcements_with_distance = []

                for annonce in queryset.select_related('city'):
                    if annonce.city:
                        distance = haversine(
                            city_obj.latitude,
                            city_obj.longitude,
                            annonce.city.latitude,
                            annonce.city.longitude,
                        )

                        if distance <= 100:  # km radius
                            announcements_with_distance.append((annonce.id, distance))

                # sort by distance
                announcements_with_distance.sort(key=lambda x: x[1])

                ordered_ids = [a[0] for a in announcements_with_distance]

                # preserve order in queryset
                preserved_order = Case(
                    *[When(id=pk, then=pos) for pos, pk in enumerate(ordered_ids)]
                )
                    
                queryset = queryset.filter(id__in=ordered_ids).order_by(preserved_order)

            except (City.DoesNotExist, ValueError):
                pass


        

        # Filter by account type
        if account_type:
            queryset = queryset.filter(created_by__profile__statut__in=account_type)

        # Filter by verification
        if verified:
            queryset = queryset.filter(created_by__profile__is_verified=True)

        # Apply sorting
        # if sort_by == 'rating':
        #     queryset = queryset.order_by('-created_by__profile__average_rating', '-created_at')
        # elif sort_by == 'distance':
        #     # For distance sorting, we'd need user location - for now, just sort by date
        #     queryset = queryset.order_by('-created_at')
        # else:
        #    
        queryset = queryset.order_by('-created_at') 

        # Limit results for initial load
        queryset = queryset[:50]

        serializer = AnnouncementSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    return c * 6371 


class PrestatairesListAPI(APIView):
    def get(self, request):
        skills_param = request.GET.get('skills', '')
        city_param = request.GET.get('city', '')
        sort_by = request.GET.get('sort_by', 'date')
        account_type = request.GET.getlist('account_type', [])
        verified = request.GET.get('verified', 'false').lower() == 'true'
        search_radius = request.GET.get('search_radius', '50')

        try:
            search_radius = float(search_radius)
        except ValueError:
            search_radius = 50

        if skills_param:
            skill_ids = [int(sid) for sid in skills_param.split(',') if sid]
        else:
            skill_ids = Skill.objects.all().values_list('id', flat=True)


        queryset = Profile.objects.filter(
            type="towork",
            city__isnull=False,
            bio__isnull=False,
            skills__id__in=skill_ids,
        ).distinct().select_related(
            'user', 'city'
        ).prefetch_related(
            'skills', 'received_reviews'
        )
        if account_type:
            queryset = queryset.filter(statut__in=account_type)

        # Filter by verification
        if verified:
            queryset = queryset.filter(is_verified=True)


        profiles = list(queryset)  # ✅ ensure list of Profile objects

        if city_param:
           
            city = City.objects.get(id=int(city_param))
       
            filtered_profiles = []

            for profile in profiles:
                lat = profile.latitude or profile.city.latitude
                lng = profile.longitude or profile.city.longitude

                if lat and lng:
                    distance = haversine(
                        city.latitude,
                        city.longitude,
                        lat,
                        lng
                    )

                    if distance <= search_radius:
                        profile.distance = round(distance, 2)  # ✅ attach
                        filtered_profiles.append(profile)

            # Apply sorting
            if sort_by == 'rating':
                
                profiles = sorted(filtered_profiles,key=lambda p: p.average_rating() or 0, reverse=True)
            else:
                profiles = sorted(filtered_profiles, key=lambda p: p.distance)
        else:
            queryset = queryset.filter(profile_picture__isnull=False).order_by('-id')
            profiles = list(queryset)
            if sort_by == 'rating':
                
                profiles = sorted(profiles,key=lambda p: p.average_rating() or 0, reverse=True)
            




        profiles = profiles[:100]

        serializer = PrestataireListSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SkillsAPI(APIView):
    def get(self, request):
        skills = Skill.objects.all().order_by('name_fr')
      
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class CitiesAPI(APIView):
    def get(self, request):
        # country_code = request.GET.get("country")
        # try:
        #     country =  Country.objects.get(code=country_code)
        # except Exception as e:
        #     country = Country.objects.get(code="FR")

        # cities = country.cities.all().order_by('name_fr')
        cities = City.objects.all().order_by('name_fr')
      
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserFavoritesAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        favorites = FavoriteProfile.objects.filter(user=user).select_related('profile', 'profile__user')
        serializer = FavoriteProfileSerializer(favorites, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileAPI(APIView):
    def get(self, request, slug):
        try:
            profile = Profile.objects.get(slug=slug)
            serializer = ProfileSerializer(profile, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def account_infos_api(request):
    user = request.user
    profile = user.profile

    if request.method == "PUT":
        data = request.data

        # Update User fields
        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        user.save()

        # Update Profile fields
        profile.phone_number = data.get("phone_number", profile.phone_number)
        profile.statut = data.get("statut", profile.statut)
        profile.type = data.get("type", profile.type)
        profile.gender = data.get("gender", profile.gender)
        profile.prenom = data.get("prenom", profile.prenom)
        profile.nom = data.get("nom", profile.nom)
        profile.date_naissance = data.get("dateNaissance") or profile.date_naissance

        if profile.statut == "entreprise":
            profile.nom_commercial = data.get("nomCommercial", profile.nom_commercial)
            profile.siret = data.get("siret", profile.siret)
            profile.code_ape = data.get("codeApe", profile.code_ape)
            profile.date_creation = data.get("dateCreation") or profile.date_creation

        city_id = data.get("cityId")
        if city_id:
            profile.city_id = city_id

        profile.save()
        return Response(
            {"success": True, "message": "Informations mises à jour"},
            status=status.HTTP_200_OK
        )

    # GET method: send current user/profile info
    return Response({
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "type": getattr(profile, 'type', None),
        "statut": getattr(profile, 'statut', None),
        "phone_number": getattr(profile, 'phone_number', None),
        "prenom": getattr(profile, 'prenom', None) or user.first_name,
        "nom": getattr(profile, 'nom', None) or user.last_name,
        "gender": getattr(profile, 'gender', None),
        "nom_commercial": getattr(profile, 'nom_commercial', None),
        "siret": getattr(profile, 'siret', None),
        "code_ape": getattr(profile, 'code_ape', None),
        "profile": {
            "city": {"name_fr": profile.city.name_fr} if getattr(profile, 'city', None) else None,
        },
    }, status=status.HTTP_200_OK)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from .serializers import AnnouncementSerializer


# ===== auth/users/me/ — profil complet du user connecté =====
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def me_api(request):
    user = request.user
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=user)

    if request.method in ['PATCH', 'DELETE'] and not request.user.is_staff:
        return Response({'error': 'Acces refuse'}, status=403)

    if request.method == 'DELETE':
        if user.id == request.user.id:
            return Response({'error': 'Impossible de supprimer votre propre compte admin.'}, status=400)
        user.delete()
        return Response({'success': True})

    if request.method == 'PATCH':
        data = request.data
        # User fields
        user.first_name = data.get('prenom', user.first_name) or user.first_name
        user.last_name  = data.get('nom', user.last_name) or user.last_name
        user.save()
        # Profile fields
        for field in ['prenom', 'nom', 'phone_number', 'bio', 'gender', 'statut', 'type', 'nom_commercial', 'siret', 'radius']:
            if field in data:
                setattr(profile, field, data[field])
        city_id = data.get('city_id')
        if city_id:
            try:
                profile.city = City.objects.get(id=city_id)
            except City.DoesNotExist:
                pass
        skill_ids = data.get('skill_ids', [])
        if skill_ids:
            profile.skills.set(Skill.objects.filter(id__in=skill_ids))
        # Photo de profil
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
        profile.save()

    serializer = ProfileSerializer(profile, context={'request': request})
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'prenom': getattr(profile, 'prenom', '') or user.first_name,
        'nom': getattr(profile, 'nom', '') or user.last_name,
        'slug': getattr(profile, 'slug', ''),
        'profile': serializer.data,
    })


# ===== auth/users/:id/ — profil public (GET) ou modification admin (PATCH) =====
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_by_id_api(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=404)

    if request.method == 'PATCH':
        if not request.user.is_staff:
            return Response({'error': 'Accès refusé'}, status=403)
        data = request.data
        if 'email' in data:
            user.email = data['email']
        if 'prenom' in data:
            user.first_name = data['prenom']
        if 'nom' in data:
            user.last_name = data['nom']
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        if data.get('action') in ['suspend', 'ban']:
            if user.id == request.user.id:
                return Response({'error': 'Impossible de modifier votre propre compte admin.'}, status=400)
            user.is_active = False
        user.save()
        try:
            profile = user.profile
            if 'localisation' in data:
                profile.localisation = data['localisation']
            if 'role' in data:
                if data['role'] == 'Prestataire':
                    profile.type = 'towork'
                elif data['role'] == 'Client':
                    profile.type = 'tohire'
                elif data['role'] == 'Admin':
                    user.is_staff = True
                    user.save()
            if 'kyc_status' in data:
                if data['kyc_status'] == 'verified':
                    profile.is_identity_verified = True
                    profile.is_identity_verified_request = False
                    profile.is_verified = True
                elif data['kyc_status'] == 'pending':
                    profile.is_identity_verified = False
                    profile.is_identity_verified_request = True
                    profile.is_verified = False
                elif data['kyc_status'] == 'rejected':
                    profile.is_identity_verified = False
                    profile.is_identity_verified_request = False
                    profile.is_verified = False
            if 'abonnement' in data:
                profile.abonnement = data['abonnement']
            if data.get('action') == 'verify_kyc':
                profile.is_identity_verified = True
                profile.is_identity_verified_request = False
                profile.is_verified = True
            if data.get('action') == 'make_pro':
                profile.abonnement = 'pro'
            profile.save()
        except Exception:
            pass
        return Response({'success': True})

    try:
        profile = user.profile
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response({'id': user.id, 'username': user.username, 'profile': serializer.data})
    except Profile.DoesNotExist:
        return Response({'error': 'Profil introuvable'}, status=404)


# ===== reviews/<slug>/ — soumettre ou supprimer un avis =====
@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def submit_review_api(request, slug):
    reviewed_profile = get_object_or_404(Profile, slug=slug)
    reviewer = request.user

    if reviewed_profile.user == reviewer:
        return Response({'error': 'Vous ne pouvez pas vous noter vous-même.'}, status=400)

    if request.method == 'DELETE':
        Review.objects.filter(reviewer=reviewer, reviewed=reviewed_profile).delete()
        return Response({'success': True})

    rating = request.data.get('rating')
    comment = request.data.get('comment', '').strip()

    valid_ratings = [1.0, 2.0, 3.0, 4.0, 5.0]
    try:
        rating = float(rating)
        if rating not in valid_ratings:
            raise ValueError
    except (TypeError, ValueError):
        return Response({'error': 'Note invalide (1 à 5).'}, status=400)

    review, created = Review.objects.update_or_create(
        reviewer=reviewer,
        reviewed=reviewed_profile,
        defaults={'rating': rating, 'comment': comment},
    )
    serializer = ReviewSerializer(review)
    return Response({'success': True, 'review': serializer.data}, status=201 if created else 200)


# ===== reviews/user/:id/ — avis reçus par un user =====
@api_view(['GET'])
def reviews_by_user_api(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        reviews = Review.objects.filter(reviewed=user).select_related('reviewer', 'reviewer__profile')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response([], status=200)


# ===== auth/users/me/kyc/ — upload document KYC =====
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kyc_upload_api(request):
    profile = request.user.profile
    if 'document' in request.FILES:
        profile.piece_identite = request.FILES['document']
        profile.is_identity_verified_request = True
        profile.save()
        return Response({'success': True, 'message': 'Document envoyé pour vérification.'})
    return Response({'error': 'Aucun fichier fourni.'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_announcement_simple(request):
    """Endpoint simplifié pour créer une annonce depuis le modal frontend."""
    user = request.user
    data = request.data

    type_ann = data.get('type')  # 'demande' ou 'offre'
    description = data.get('description', '').strip()
    if not description:
        return Response({'success': False, 'error': 'Description obligatoire.'}, status=400)

    cat_name = 'Offre de services' if type_ann == 'offre' else 'Demande de prestation'
    try:
        category = AnnouncementCategory.objects.get(name_fr=cat_name)
    except AnnouncementCategory.DoesNotExist:
        category = AnnouncementCategory.objects.filter(name_fr__icontains=cat_name[:5]).first()

    # Ville par défaut : première ville disponible si pas fournie
    city_id = data.get('city_id')
    city = None
    if city_id:
        city = City.objects.filter(id=city_id).first()
    if not city:
        city = City.objects.first()

    budget_min = data.get('budget_min') or None
    budget_max = data.get('budget_max') or None

    announcement = Announcement.objects.create(
        category=category,
        description=description,
        created_by=user,
        city=city,
        a_convenir=not (budget_min or budget_max),
        budget_min=budget_min,
        budget_max=budget_max,
        moderation_status='approved',  # Directly approved, visible in feed
    )

    skill_ids = data.get('skill_ids', [])
    if skill_ids:
        announcement.skills.set(Skill.objects.filter(id__in=skill_ids))

    serializer = AnnouncementSerializer(announcement)
    return Response({
        'success': True,
        'announcement': serializer.data,
        'message': 'Votre annonce est en attente de validation par notre équipe. Elle sera publiée sous 24h.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_announcement(request):
    user = request.user

    # Get selected skills
    skill_ids = request.POST.getlist('skills')
    skills = Skill.objects.filter(id__in=skill_ids)

    # Get city
    city_id = request.POST.get('location')
    if not city_id:
        return Response({"success": False, "error_message": "Veuillez sélectionner une ville."})
    try:
        city = City.objects.get(id=city_id)
    except ObjectDoesNotExist:
        return Response({"success": False, "error_message": "Ville invalide."})

    # Get type / category
    type_key = request.POST.get('statut')
    CATEGORY_MAP = {
        "demande_prestation": "Demande de prestation",
        "offre_service": "Offre de services",
        "vente_materiel": "Vente de matériel",
        "location_materiel": "Location de matériel",
    }

    category_name = CATEGORY_MAP.get(type_key)
    if not category_name:
        return Response({"success": False, "error_message": "Type d'annonce invalide."})

    try:
        category = AnnouncementCategory.objects.get(name_fr=category_name)
    except AnnouncementCategory.DoesNotExist:
        category = None

    description = request.POST.get('description', '')

    # Budget
    a_convenir = request.POST.get('a_convenir') == 'on'
    budget = request.POST.get('budget')

    if a_convenir:
        budget = None
    else:
        budget = float(budget)
        


    announcement = Announcement.objects.create(
        category=category,
        description=description,
        created_by=user,
        city=city,
        a_convenir=a_convenir,
        budget=budget,
        image1=request.FILES.get('image1'),
        image2=request.FILES.get('image2'),
        image3=request.FILES.get('image3'),
        image4=request.FILES.get('image4'),
    )

    # Add skills
    for skill in skills:
        announcement.skills.add(skill)

    announcement.save()

    serializer = AnnouncementSerializer(announcement)
    return Response({"success": True, "announcement": serializer.data})


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Max

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations_api(request):
    user = request.user

    conversations = Conversations.objects.filter(
        Q(user1=user) | Q(user2=user)
    ).annotate(
        last_message_time=Max("messages__timestamp")
    ).order_by("-last_message_time")

    data = []

    import re
    def strip_html(text):
        return re.sub(r'<[^>]+>', '', text or '').strip()

    for convo in conversations:
        partner = convo.user1 if convo.user2 == user else convo.user2
        last_message = convo.messages.order_by("-timestamp").first()
        unread_count = convo.messages.filter(sender=partner, is_read=False).count()
        try:
            slug = partner.profile.slug
            avatar = partner.profile.profile_picture_url
        except Exception:
            slug = ''
            avatar = None
        data.append({
            "id": convo.id,
            "partner": {
                "id": partner.id,
                "username": partner.username,
                "slug": slug,
                "avatar": avatar,
            },
            "last_message": {
                "body": strip_html(last_message.body) if last_message else "",
                "timestamp": str(last_message.timestamp) if last_message else None,
                "is_read": (last_message.is_read or last_message.sender == user) if last_message else True,
            },
            "unread_count": unread_count,
        })
    

    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_detail_api(request, slug):
    partner_profile = Profile.objects.get(slug=slug)
    user = request.user
    partner = partner_profile.user

    # Try to find an existing conversation
    conversation = Conversations.objects.filter(
        (Q(user1=user) & Q(user2=partner)) |
        (Q(user1=partner) & Q(user2=user))
    ).first()
    if conversation:
        Message.objects.filter(
            conversation=conversation,
            sender=partner,
            is_read=False
        ).update(is_read=True)

    if not conversation:
        # Ensure user1 id < user2 id for uniqueness
        if user.id < partner.id:
            conversation = Conversations.objects.create(user1=user, user2=partner)
        else:
            conversation = Conversations.objects.create(user1=partner, user2=user)

    recipient = conversation.user1 if conversation.user2 == user else conversation.user2
    
    
    if request.method == "POST":
        body = request.data.get("body")
        if body:
            Message.objects.create(conversation=conversation, sender=user, body=body)
        return Response({"status": "ok"})

    # GET messages
    import re
    def strip_html(text):
        return re.sub(r'<[^>]+>', '', text or '').strip()

    messages = conversation.messages.all().order_by("timestamp")
    data = [
        {
            "id": m.id,
            "sender": m.sender.id,
            "body": strip_html(m.body),
            "file": m.file.url if m.file else None,
            "timestamp": str(m.timestamp),
            "is_read": m.is_read,
        }
        for m in messages
    ]
    try:
        rec_slug   = recipient.profile.slug
        rec_avatar = recipient.profile.profile_picture_url
    except Exception:
        rec_slug   = ''
        rec_avatar = None

    return Response({
        "messages": data,
        "recipient": {
            "id": recipient.id,
            "username": recipient.username,
            "slug": rec_slug,
            "avatar": rec_avatar,
        }
    })


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_project_api(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()
    if not profile:
        return Response({"success": False, "error_message": "Profil non trouvé."})

    # Get images
    images = [request.FILES.get(f'image{i}') for i in range(1, 5)]
    uploaded_images = [img for img in images if img]  # remove None

    
    # Get skills
    skill_ids = request.data.getlist('skills')  # array of skill IDs
    if not skill_ids:
        return Response({"success": False, "error_message": "Veuillez sélectionner au moins une compétence."})

    selected_skills = Skill.objects.filter(id__in=skill_ids)

    description = request.data.get('description', '').strip()
    if not description:
        return Response({"success": False, "error_message": "Veuillez ajouter une description."})

    # Create project
    project = Project.objects.create(
        user=profile.user,
        description=description,
        image1=request.FILES.get('image1'),
        image2=request.FILES.get('image2'),
        image3=request.FILES.get('image3'),
        image4=request.FILES.get('image4'),
    )

    for skill in selected_skills:
        project.skills.add(skill)

    project.save()

    return Response({
        "success": True,
        "project": {
            "id": project.id,
            "description": project.description,
        }
    })



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def edit_profile_api(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()

    if not profile:
        return Response({"error": "Profile not found"}, status=404)

       
    if request.method == "PUT":
        profile.bio = request.data.get("bio", profile.bio)
        profile.title = request.data.get("title", profile.title)

        # Skills (array of IDs)
        skills = request.data.get("skills", [])
        skill_ids = request.POST.getlist('skills')
        skills = Skill.objects.filter(id__in=skill_ids)
        
        profile.skills.set(skills)

        

        # Location
        radius = request.data.get("radius")
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        if radius:
            profile.radius = float(radius)

        if latitude and longitude:
            profile.latitude = float(latitude)
            profile.longitude = float(longitude)

        # Profile picture
        if request.FILES.get("profile_picture"):
            profile.profile_picture = request.FILES["profile_picture"]

        # Cover picture
        if request.FILES.get("cover_picture"):
            profile.cover_picture = request.FILES["cover_picture"]

        profile.save()

        return Response({"success": True})

    return Response({
            "bio": profile.bio,
            "radius": profile.radius,
            "latitude": profile.latitude,
            "longitude": profile.longitude,
            "slug": profile.slug,
            "skills": [
                {"id": s.id, "name_fr": s.name_fr}
                for s in profile.skills.all()
            ],
            "profile_picture": profile.profile_picture_url,
            "cover_picture": profile.cover_picture_url,
        })

# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class ToggleFavoriteProfile(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            profile = Profile.objects.get(slug=slug)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        favorite_qs = FavoriteProfile.objects.filter(user=user, profile=profile)

        if favorite_qs.exists():
            # Already favorited → remove
            favorite_qs.delete()
            favorited = False
        else:
            # Not favorited → add
            FavoriteProfile.objects.create(user=user, profile=profile)
            favorited = True

        return Response({'favorited': favorited}, status=status.HTTP_200_OK)


class AdminStatsAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models.functions import TruncMonth, TruncDate

        now = timezone.now()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)
        six_months_ago = now - timedelta(days=180)

        total = User.objects.count()
        new_month = User.objects.filter(date_joined__gte=month_ago).count()
        prestataires = Profile.objects.filter(type='towork').count()
        prestataires_month = Profile.objects.filter(type='towork', user__date_joined__gte=month_ago).count()
        kyc_pending = Profile.objects.filter(is_identity_verified_request=True, is_identity_verified=False).count()
        suspended = User.objects.filter(is_active=False).count()
        suspended_week = User.objects.filter(is_active=False, date_joined__gte=week_ago).count()
        total_annonces = Announcement.objects.count()
        annonces_month = Announcement.objects.filter(created_at__gte=month_ago).count()

        # Inscriptions par mois (6 derniers mois)
        monthly_signups = (
            User.objects.filter(date_joined__gte=six_months_ago)
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
        signups_labels = [MONTHS_FR[r['month'].month - 1] for r in monthly_signups]
        signups_data = [r['count'] for r in monthly_signups]

        # Annonces par mois (6 derniers mois)
        monthly_annonces = (
            Announcement.objects.filter(created_at__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        annonces_labels = [MONTHS_FR[r['month'].month - 1] for r in monthly_annonces]
        annonces_data = [r['count'] for r in monthly_annonces]

        # Répartition rôles
        clients = total - prestataires - User.objects.filter(is_staff=True).count()
        admins = User.objects.filter(is_staff=True).count()

        # Inscriptions 7 derniers jours
        daily_signups = (
            User.objects.filter(date_joined__gte=week_ago)
            .annotate(day=TruncDate('date_joined'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        day_labels = [(now - timedelta(days=i)).strftime('%a') for i in range(6, -1, -1)]
        day_map = {str(r['day']): r['count'] for r in daily_signups}
        day_data = [day_map.get(str((now - timedelta(days=i)).date()), 0) for i in range(6, -1, -1)]

        return Response({
            'total_users': total,
            'new_users_month': new_month,
            'prestataires_actifs': prestataires,
            'prestataires_month': prestataires_month,
            'kyc_pending': kyc_pending,
            'comptes_suspendus': suspended,
            'suspendus_semaine': suspended_week,
            'total_annonces': total_annonces,
            'annonces_month': annonces_month,
            'charts': {
                'signups_monthly': {'labels': signups_labels, 'data': signups_data},
                'annonces_monthly': {'labels': annonces_labels, 'data': annonces_data},
                'roles': {'labels': ['Clients', 'Prestataires', 'Admins'], 'data': [max(clients,0), prestataires, admins]},
                'signups_daily': {'labels': day_labels, 'data': day_data},
            }
        })


class AdminUsersAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Aggregate reviews per profile in one query
        review_stats = {
            r['reviewed_id']: r
            for r in Review.objects.values('reviewed_id').annotate(
                avg=Avg('rating'), count=Count('id')
            )
        }

        users = User.objects.select_related('profile__city').prefetch_related(
            'profile__skills'
        ).order_by('-date_joined')

        data = []
        for u in users:
            profile = getattr(u, 'profile', None)
            city_name = profile.city.name_fr if (profile and profile.city) else ''

            if u.is_staff:
                role = 'admin'
            elif profile and profile.type == 'towork':
                role = 'prestataire'
            else:
                role = 'client'

            if profile and profile.is_verified:
                kyc_status = 'verified'
            elif profile and profile.is_identity_verified_request:
                kyc_status = 'pending'
            else:
                kyc_status = 'N/A'

            stats = review_stats.get(profile.id, {'avg': None, 'count': 0}) if profile else {'avg': None, 'count': 0}

            data.append({
                'id': u.id,
                'prenom': (profile.prenom or u.first_name) if profile else u.first_name,
                'nom': (profile.nom or u.last_name) if profile else u.last_name,
                'email': u.email,
                'role': role,
                'is_active': u.is_active,
                'kyc_status': kyc_status,
                'localisation': city_name,
                'date_joined': u.date_joined,
                'profile': {
                    'note_moyenne': round(stats['avg'], 1) if stats['avg'] else None,
                    'nb_avis': stats['count'],
                    'competences': [s.name_fr for s in profile.skills.all()] if profile else [],
                    'abonnement': getattr(profile, 'abonnement', 'gratuit') if profile else 'gratuit',
                },
            })

        return Response(data)


# ===== ADMIN — Modération annonces =====
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_annonces_list(request):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    status_filter = request.GET.get('status', 'pending')
    qs = Announcement.objects.select_related('created_by__profile','category','city').order_by('created_at')
    if status_filter != 'all':
        qs = qs.filter(moderation_status=status_filter)
    data = []
    for a in qs:
        u = a.created_by
        p = getattr(u, 'profile', None)
        data.append({
            'id': a.id,
            'description': (a.description or '')[:200],
            'category': a.category.name_fr if a.category else '',
            'type': 'offre' if (a.category and 'offre' in a.category.name_fr.lower()) else 'demande',
            'moderation_status': a.moderation_status,
            'moderation_note': a.moderation_note or '',
            'created_at': str(a.created_at),
            'city': a.city.name_fr if a.city else '',
            'budget_min': a.budget_min,
            'budget_max': a.budget_max,
            'author': {'id': u.id, 'username': u.username, 'email': u.email, 'slug': p.slug if p else ''},
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_annonce_approve(request, pk):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        ann = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)
    ann.moderation_status = 'approved'
    ann.moderation_note = ''
    ann.save()
    return Response({'success': True, 'id': ann.id, 'status': 'approved'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_annonce_reject(request, pk):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        ann = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)
    ann.moderation_status = 'rejected'
    ann.moderation_note = request.data.get('reason', 'Non spécifié')
    ann.save()
    return Response({'success': True, 'id': ann.id, 'status': 'rejected'})


# ===== ADMIN — Gestion des Offres =====
from app.models import Offer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_offres_list(request):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    status_filter = request.GET.get('status', 'all')
    qs = Offer.objects.select_related(
        'sender__profile', 'announcement__created_by__profile',
        'announcement__category', 'announcement__city'
    ).order_by('-created_at')
    if status_filter != 'all':
        qs = qs.filter(status=status_filter)
    data = []
    for o in qs:
        s = o.sender
        sp = getattr(s, 'profile', None)
        ann = o.announcement
        client = ann.created_by
        cp = getattr(client, 'profile', None)
        data.append({
            'id': o.id,
            'price': o.price,
            'message': (o.message or '')[:300],
            'status': o.status,
            'created_at': str(o.created_at),
            'sender': {
                'id': s.id,
                'username': s.username,
                'email': s.email,
                'slug': sp.slug if sp else '',
                'is_verified': sp.is_verified if sp else False,
            },
            'announcement': {
                'id': ann.id,
                'description': (ann.description or '')[:120],
                'category': ann.category.name_fr if ann.category else '',
                'city': ann.city.name_fr if ann.city else '',
                'client': client.username,
                'client_slug': cp.slug if cp else '',
            },
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_offre_accept(request, pk):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        offer = Offer.objects.get(pk=pk)
    except Offer.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)
    offer.status = 'accepted'
    offer.save()
    return Response({'success': True, 'id': offer.id, 'status': 'accepted'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_offre_refuse(request, pk):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        offer = Offer.objects.get(pk=pk)
    except Offer.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)
    offer.status = 'refused'
    offer.save()
    return Response({'success': True, 'id': offer.id, 'status': 'refused'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_offre_delete(request, pk):
    if not request.user.is_staff:
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        offer = Offer.objects.get(pk=pk)
    except Offer.DoesNotExist:
        return Response({'error': 'Introuvable'}, status=404)
    offer.delete()
    return Response({'success': True})
