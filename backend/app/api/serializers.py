from rest_framework import serializers
from app.models import *

from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password





class AccountInfoSerializer(serializers.Serializer):
    # User
    username = serializers.CharField()
    email = serializers.EmailField()

    # Profile common
    phone_number = serializers.CharField(required=False, allow_blank=True)
    statut = serializers.ChoiceField(choices=["particulier", "entreprise"])
    type = serializers.ChoiceField(choices=["work", "hire"])
    cityId = serializers.IntegerField(required=False, allow_null=True)

    # Particulier
    prenom = serializers.CharField(required=False, allow_blank=True)
    nom = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    dateNaissance = serializers.DateField(required=False, allow_null=True)

    # Entreprise
    nomCommercial = serializers.CharField(required=False, allow_blank=True)
    siret = serializers.CharField(required=False, allow_blank=True)
    codeApe = serializers.CharField(required=False, allow_blank=True)
    dateCreation = serializers.DateField(required=False, allow_null=True)

    def validate_username(self, value):
        user = self.context["request"].user
        if User.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError("Nom d'utilisateur déjà utilisé")
        return value

    def validate_email(self, value):
        user = self.context["request"].user
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Email déjà utilisé")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "password", "email"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"]
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])


    class Meta:
        model = User
        fields = ("username", "email", "password")


    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"]
        )
        user.set_password(validated_data["password"])
        user.save()
        return user




class ProfileMiniSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['slug', 'profile_picture', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        return obj.profile_picture_url


class UserMiniSerializer(serializers.ModelSerializer):
    profile = ProfileMiniSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'profile']

class AnnouncementCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementCategory
        fields = ['id', 'name_fr']

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['code', 'currency']


class CitySerializer(serializers.ModelSerializer):

    country = CountrySerializer(read_only=True)

    class Meta:
        model = City
        fields = ['id','name_fr', 'country']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name_fr']


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    category = AnnouncementCategorySerializer(read_only=True)
    city = CitySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    image1 = serializers.ImageField(read_only=True)
    image2 = serializers.ImageField(read_only=True)
    image3 = serializers.ImageField(read_only=True)
    image4 = serializers.ImageField(read_only=True)

    class Meta:
        model = Announcement
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(source='user', read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    image1 = serializers.ImageField(read_only=True)
    image2 = serializers.ImageField(read_only=True)
    image3 = serializers.ImageField(read_only=True)
    image4 = serializers.ImageField(read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'reviewer', 'rating', 'comment', 'timestamp']

    def get_reviewer(self, obj):
        return {
            "username": obj.reviewer.username,
            "profile_picture_url": obj.reviewer.profile.profile_picture_url
        }
class ProfileSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    city = CitySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    cover_picture_url = serializers.SerializerMethodField()
    rating_data = serializers.SerializerMethodField() 
    annonces = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    reviews = ReviewSerializer(many=True, source='received_reviews', read_only=True)
    class Meta:
        model = Profile
        fields = [
            'user', 'bio', 'city', 'statut', 'type', 'skills',
            'latitude', 'longitude', 'radius', 'is_verified',
            'average_rating', 'review_count', 'profile_picture_url', 'cover_picture_url',
            'rating_data', 'reviews', 'annonces', 'prenom', 'nom', 'gender', 'projects',
            'nom_commercial', 'is_favorite', 'siret', 'is_email_verified',
            'is_identity_verified', 'is_identity_verified_request', 'phone_number', 'slug'
        ]

    def get_average_rating(self, obj):
        reviews = obj.received_reviews.all()
        if not reviews.exists():
            return 0
        return round(sum([r.rating for r in reviews]) / reviews.count(), 1)

    def get_review_count(self, obj):
        return obj.received_reviews.count()

    def get_profile_picture_url(self, obj):
        return obj.profile_picture_url

    def get_cover_picture_url(self, obj):
        return obj.cover_picture_url
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_prodiles_by.filter(user=request.user).exists()
        return False
    
    def get_rating_data(self, obj):
        """
        Retourne la répartition des votes par étoiles (1-5) pour le profil.
        Format : [{"star": 5, "percent": 60, "count": 12}, ...]
        """
        reviews = obj.received_reviews.all()
        total_count = reviews.count()
        data = []

        for star in range(5, 0, -1):
            count = reviews.filter(rating=star).count()
            percent = (count / total_count * 100) if total_count > 0 else 0
            data.append({
                "star": star,
                "percent": round(percent),
                "count": count
            })
        return data
    def get_annonces(self, obj):
        annonces = Announcement.objects.filter(created_by=obj.user)
        return AnnouncementSerializer(annonces, many=True, context=self.context).data
    def get_projects(self, obj):
        projects = Project.objects.filter(user=obj.user)
        return ProjectSerializer(projects, many=True, context=self.context).data
    
    
class FavoriteProfileSerializer(serializers.ModelSerializer):
    profile_id = serializers.IntegerField(source='profile.id')
    username = serializers.CharField(source='profile.user.username')
    slug = serializers.CharField(source='profile.slug')
    profile_picture_url = serializers.SerializerMethodField(source='profile.profile_picture_url')
    # add other profile fields as needed

    class Meta:
        model = FavoriteProfile
        fields = ['id', 'profile_id', 'username', 'slug', 'added_at', 'profile_picture_url']

    def get_is_favorite(self, obj):
        return True 
    def get_profile_picture_url(self, obj):
        return obj.profile.profile_picture_url
    
class PrestataireListSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    skills = SkillSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'slug', 'profile_picture', 'is_verified', 'bio',
            'city', 'distance', 'statut', 'average_rating', 'review_count', 'user', 'skills'
        ]

    def get_user(self, obj):
        return {'username': obj.user.username}

    def get_city(self, obj):
        return obj.city.name_fr if obj.city else ''

    def get_profile_picture(self, obj):
        return obj.profile_picture_url

    def get_average_rating(self, obj):
        rating = obj.average_rating()
        return float(rating) if rating else 0.0

    def get_review_count(self, obj):
        return obj.review_count()
    def get_distance(self, obj):
        # distance is attached dynamically in the view
        return getattr(obj, 'distance', None)
    
