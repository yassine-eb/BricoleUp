from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
from datetime import date

from django.templatetags.static import static

class Contract(models.Model):
    employer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contracts_as_employer')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contracts_as_worker')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    price = models.FloatField(null=True, blank=True)
    image1 = models.ImageField(upload_to='contracts/', blank=True, null=True)
    image2 = models.ImageField(upload_to='contracts/', blank=True, null=True)
    image3 = models.ImageField(upload_to='contracts/', blank=True, null=True)
    image4 = models.ImageField(upload_to='contracts/', blank=True, null=True)
    image5 = models.ImageField(upload_to='contracts/', blank=True, null=True)
    image6 = models.ImageField(upload_to='contracts/', blank=True, null=True)
    start_date = models.DateTimeField(null=True, blank=True)  # Start date with date and time
    hours = models.FloatField(null=True, blank=True)  # Number of hours
    adresse = models.CharField(max_length=255, blank=True, null=True)
    city = models.ForeignKey('City', on_delete=models.SET_NULL, null=True, blank=True)
    skills = models.ManyToManyField('Skill', blank=True)
    is_paid = models.BooleanField(default=False)

    status = models.CharField(
        max_length=50,
        choices=[
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
            ('waiting_for_payment', 'Waiting for Payment')
        ],
        default='in_progress'
    )

    def __str__(self):
        return f"{self.title} ({self.employer.username} → {self.worker.username})"


class Payment(models.Model):
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_made')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_received')
    contract = models.ForeignKey('Contract', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.FloatField(null=True, blank=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    payment_date = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        previous_status = None
        if not is_new:
            previous_status = Payment.objects.get(pk=self.pk).status

        super().save(*args, **kwargs)

        # Update balance only if it's a new completed payment or status changed to completed
        if (is_new and self.status == 'completed') or (previous_status != 'completed' and self.status == 'completed'):
            recipient_profile = self.recipient.profile
            recipient_profile.balance += self.amount
            recipient_profile.save()

    def __str__(self):
        return f"{self.amount}€ - {self.payer.username} → {self.recipient.username} ({self.status})"



class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    announcement = models.ForeignKey('Announcement', on_delete=models.CASCADE, related_name="favorited_by")
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'announcement') 

    def __str__(self):
        return f"{self.user.username} - {self.announcement.id}"
class FavoriteProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites_profiles")
    profile = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name="favorited_prodiles_by")
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'profile') 

    def __str__(self):
        return f"{self.user.username} - {self.profile.user.username}"
class Profile(models.Model):
    
    USER_TYPE_CHOICES = [
        ('towork', 'I want to work'),
        ('tohire', 'I want to hire'),
    ]

    STATUT_CHOICES = [
        ('particulier', 'Particulier'),
        ('entreprise', 'Entreprise'),
    ]

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='particulier',  # default value to match your form default
    )

    
    type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='towork', db_index=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    cover_picture = models.ImageField(upload_to='cover_pictures/', blank=True, null=True)

    bio = models.CharField(max_length=1000,blank=True, null=True, default="")
    city = models.ForeignKey('City', on_delete=models.SET_NULL, null=True, blank=True)
    country = models.ForeignKey('Country', on_delete=models.SET_NULL, null=True, blank=True)  
    language = models.ForeignKey('Language', on_delete=models.SET_NULL, null=True, blank=True) 
  

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    radius = models.FloatField(null=True, blank=True)
    skills = models.ManyToManyField('Skill', blank=True)
    subskills = models.ManyToManyField('SubSkill', blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    slug = models.SlugField(unique=True, blank=True)

    
    is_verified = models.BooleanField(default=False)
    abonnement = models.CharField(
        max_length=20,
        choices=[('gratuit', 'Gratuit'), ('pro', 'Pro')],
        default='gratuit',
    )
    

    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    


    prenom = models.CharField(max_length=100, blank=True, null=True)
    nom = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)

    # Company info
    nom_commercial = models.CharField(max_length=200, blank=True, null=True)
    siret = models.CharField(max_length=20, blank=True, null=True)
  

    is_identity_verified = models.BooleanField(default=False)
    is_identity_verified_request = models.BooleanField(default=False)
 
    # Particulier / dirigeant
    piece_identite = models.FileField(
        upload_to='verifications/pieces_identite/',
        null=True,
        blank=True
    )

    # Entreprise
    document_entreprise = models.FileField(
        upload_to='verifications/entreprises/',
        null=True,
        blank=True
    )

    
    def save(self, *args, **kwargs):
        if not self.slug:  # 👈 IMPORTANT
            base_slug = slugify(self.user.username)
            slug = base_slug
            num = 1

            while Profile.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{num}"
                num += 1

            self.slug = slug

        super().save(*args, **kwargs)

    

    def __str__(self):
        return self.user.username
    
    def average_rating(self):
        reviews = self.received_reviews.all()
        if reviews.exists():
            return reviews.aggregate(models.Avg('rating'))['rating__avg']
        return 0

    def review_count(self):
        return self.received_reviews.count()
    
    def project_count(self):
        return self.user.projects.count() if self.user.projects.exists() else 0    
    def announcement_count(self):
        return self.user.announcements.count() if self.user.announcements.exists() else 0   



    @property
    def profile_picture_url(self):
        if self.profile_picture and hasattr(self.profile_picture, 'url'):
            return self.profile_picture.url
        else:
            return static('app/images/defaultprofile.png')
    @property
    def cover_picture_url(self):
        if self.cover_picture and hasattr(self.cover_picture, 'url'):
            return self.cover_picture.url

class VerificationRequest(models.Model):
    DOCUMENT_TYPES = [
        ('passport', 'Passport'),
        ('id_card', 'ID Card'),
        ('driver_license', 'Driver\'s License'),
    ]

    profile = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='verification_requests')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_file = models.FileField(upload_to='verification_documents/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ],
        default='pending'
    )
    admin_comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Verification Request by {self.profile.user.username} ({self.status})"
    
class VerificationRequestPro(models.Model):
    
    profile = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='verification_requests_pro')
    company_name = models.CharField(max_length=255, blank=True)
    company_id = models.CharField(max_length=100, blank=True)
    activity = models.CharField(max_length=255, blank=True)
    pro_document_file = models.FileField(upload_to='business_documents/', blank=True, null=True)

    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ],
        default='pending'
    )
    admin_comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Verification Request by {self.profile.user.username} ({self.status})"
    

class Language(models.Model):
    # ISO 639-1 code (e.g., 'en', 'fr', 'ar')
    code = models.CharField(max_length=2, unique=True)
    
    # English name (e.g., 'English', 'French', 'Arabic')
    name_en = models.CharField(max_length=50)
    
    # Native name (e.g., 'English', 'Français', 'العربية')
    name_native = models.CharField(max_length=50)
    
    # Is this language RTL (Right-to-Left)?
    is_rtl = models.BooleanField(default=False)
    
    # Is this language active/available on the site?
    is_active = models.BooleanField(default=True)
    
    # Flag icon (optional, using FontAwesome or similar)
    flag_icon = models.CharField(max_length=20, blank=True, default="")
    
    class Meta:
        ordering = ['name_en']
    
    def __str__(self):
        return f"{self.name_en} ({self.code})"
    
class Country(models.Model):
    name_fr = models.CharField(max_length=100, blank=True, null=True)  # French Name
    name_en = models.CharField(max_length=100, unique=True)  # English Name
    code = models.CharField(max_length=2, blank=True, null=True)  # ISO Country Code (FR, MA)
    phone_code = models.CharField(max_length=10, blank=True, null=True)  # Country Phone Code
    
    currency = models.CharField(max_length=10, blank=True, null=True)  # Currency Code (EUR, MAD)

    def __str__(self):
        return f"{self.name_fr} ({self.code})"

class City(models.Model):
    country = models.ForeignKey('Country', on_delete=models.SET_NULL, null=True, blank=True, related_name="cities")  
    name_fr = models.CharField(max_length=100, unique=True) 
    name_ar = models.CharField(max_length=100, null=True, blank=True) 
    zip_code = models.CharField(max_length=100, default="") 
    latitude = models.FloatField()  
    longitude = models.FloatField()  
    
    def __str__(self):
        return f"{self.name_fr.capitalize()}"
        
    
class Skill(models.Model):
    name_fr = models.CharField(max_length=100)

    def __str__(self):
        return self.name_fr


class SubSkill(models.Model):
    skill = models.ForeignKey(Skill, related_name='subskills', on_delete=models.CASCADE)
    name_fr = models.CharField(max_length=100)

    def __str__(self):
        return self.name_fr


class SubSubSkill(models.Model):
    subskill = models.ForeignKey(SubSkill, related_name='subsubskills', on_delete=models.CASCADE)
    name_fr = models.CharField(max_length=100)


    def __str__(self):
        return self.name_fr


class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    description = models.TextField(default="")
    skills = models.ManyToManyField('Skill', blank=True)
    
    views = models.IntegerField(default=0)
    
    image1 = models.ImageField(upload_to='projects/', blank=True, null=True)
    image2 = models.ImageField(upload_to='projects/', blank=True, null=True)
    image3 = models.ImageField(upload_to='projects/', blank=True, null=True)
    image4 = models.ImageField(upload_to='projects/', blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"project by {self.user.username} at {self.created_at}"

    @property
    def total_likes(self):
        return self.likes.count()
    @property
    def total_comments(self):
        return self.comments.count()
    
    @property
    def images(self):
        image_fields = ['image1', 'image2', 'image3', 'image4']
        return [getattr(self, img_field) for img_field in image_fields if getattr(self, img_field)]
class ProjectView(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_views')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')



class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_likes(self):
        return self.comment_likes.count()

class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)

class Review(models.Model):
    reviewer = models.ForeignKey(User, related_name='given_reviews', on_delete=models.CASCADE)
    reviewed = models.ForeignKey(Profile, related_name='received_reviews', on_delete=models.CASCADE)
    RATING_CHOICES = [
        (1.0, '1.0'),
        (2.0, '2.0'),
        (3.0, '3.0'),
        (4.0, '4.0'),
        (5.0, '5.0'),
    ]
    
    rating = models.FloatField(choices=RATING_CHOICES, default=5.0)    
    comment = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('reviewer', 'reviewed')

    def __str__(self):
        return f"{self.reviewer.username} review for {self.reviewed.user.username}"

    


class Announcement(models.Model):

   
    category = models.ForeignKey('AnnouncementCategory',on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    city = models.ForeignKey('City', on_delete=models.SET_NULL, null=True, blank=True)

    budget_min = models.FloatField(null=True, blank=True)
    budget_max = models.FloatField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.FloatField(null=True, blank=True)

    a_convenir = models.BooleanField(default=False)
    
    views = models.IntegerField(default=0)
    messages_sent = models.IntegerField(default=0)
    skills = models.ManyToManyField('Skill', blank=True)
    created_by = models.ForeignKey(User, related_name='announcements', on_delete=models.CASCADE, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    
    email_sent = models.BooleanField(default=False)
   
    image1 = models.ImageField(upload_to='announcements/', blank=True, null=True)
    image2 = models.ImageField(upload_to='announcements/', blank=True, null=True)
    image3 = models.ImageField(upload_to='announcements/', blank=True, null=True)
    image4 = models.ImageField(upload_to='announcements/', blank=True, null=True)
    image5 = models.ImageField(upload_to='announcements/', blank=True, null=True)
    image6 = models.ImageField(upload_to='announcements/', blank=True, null=True)

    MODERATION_CHOICES = [
        ('pending',  'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_CHOICES,
        default='pending',
        db_index=True,
    )
    moderation_note = models.TextField(blank=True, null=True)


class Offer(models.Model):
    announcement = models.ForeignKey(
        'Announcement',
        on_delete=models.CASCADE,
        related_name='offers'
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_offers'
    )

    price = models.FloatField(null=True, blank=True)
    message = models.TextField()

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('accepted', 'Acceptée'),
        ('refused', 'Refusée'),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['announcement', 'sender']  # one offer per user per announcement

    def __str__(self):
        return f"Offre de {self.sender.username} pour l'annonce #{self.announcement.id}"



class AnnouncementCategory(models.Model):
    name_fr = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)

    def __str__(self):
        return self.name_fr
    
class AnnouncementView(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='announcement_views')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('announcement', 'user')


class Notification(models.Model):
    
    NOTIFICATION_TYPES = [
        ("welcome", "Bienvenue"),
        ("announcement_published_owner", "Annonce publiée (owner)"),
        ("announcement_published_city", "Annonce publiée (city users)"),
        ("project_published_owner", "Projet publiée (owner)"),
        ("message", "Nouveau message"),
        ("like", "J'aime sur portfolio"),
        ("comment", "Commentaire sur portfolio"),
        ("review", "Nouvel avis"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default = "welcome")
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.URLField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)   # Extra data
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type}"


class Conversations(models.Model):
    user1 = models.ForeignKey(
        User, related_name="conversations_started", on_delete=models.CASCADE
    )
    user2 = models.ForeignKey(
        User, related_name="conversations_received", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensure uniqueness so only ONE conversation exists between 2 users
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2"], name="unique_conversation")
        ]

    def __str__(self):
        return f"Conversation between {self.user1.username} and {self.user2.username}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversations, related_name="messages", on_delete=models.CASCADE
    )
    sender = models.ForeignKey(
        User, related_name="messages_sent", on_delete=models.CASCADE
    )
    body = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    file = models.FileField(upload_to="chat_files/", null=True, blank=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"


class Report(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    reported_profile = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_profiles')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.user.username} on {self.reported_profile.username} at {self.created_at}"
    
class Reportannonce(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_annonces')
    reported_annonce = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='reported_annonces')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.user.username} on {self.reported_annonce.title} at {self.created_at}"
    


class Blog(models.Model):
    title = models.CharField(max_length=255, unique=True)  # Unique title
    slug = models.SlugField(unique=True)  # URL-friendly identifier
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp
    html_file = models.CharField(max_length=255, unique=True)  # HTML file name

    def __str__(self):
        return self.title


