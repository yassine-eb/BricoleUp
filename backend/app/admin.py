from django.contrib import admin

# Register your models here.
from .models import *


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('sender', 'announcement', 'price', 'status', 'created_at', 'updated_at')
    
    

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("timestamp",)


@admin.register(Conversations)
class ConversationsAdmin(admin.ModelAdmin):
    list_display = ("id", "user1", "user2", "created_at")
    search_fields = ("user1__username", "user2__username")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)

    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "timestamp", "is_read")
    list_filter = ("is_read", "timestamp")
    search_fields = ("sender__username", "body", "conversation__user1__username", "conversation__user2__username")
    readonly_fields = ("timestamp",)


    
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'id','bio','type', 'city','statut')
    search_fields = ('user__username', 'statut')

admin.site.register(Profile, ProfileAdmin)


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_native', 'code', 'is_active')
    list_filter = ('is_active', 'is_rtl')
    search_fields = ('name_en', 'name_native', 'code')


class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'description', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('user__username', 'title', 'description')
    readonly_fields = ('created_at',)

admin.site.register(Notification, NotificationAdmin)

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('employer','worker','title','price')

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name_en','code','phone_code','currency')
@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ('first_name','last_name','document_type')

@admin.register(VerificationRequestPro)
class VerificationRequestPro(admin.ModelAdmin):
    list_display = ('company_name','company_id','activity')    
@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name_fr',)


@admin.register(SubSkill)
class SubSkillAdmin(admin.ModelAdmin):
    list_display = ('name_fr', 'skill')
    search_fields = ('name_fr', 'skill__name_fr')
    list_filter = ('skill',)

@admin.register(SubSubSkill)
class SubSubSkillAdmin(admin.ModelAdmin):
    list_display = ('name_fr', 'subskill')
    search_fields = ('name_fr', 'subskill__name_fr')
    list_filter = ('subskill',)


    
@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name_fr',  'latitude', 'longitude')



@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('city', 'created_by',  'created_at')  # Fields to display in the admin list , 'latitude', 'longitude'
    list_filter = ('city', 'created_by')  # Filters for the admin list
    search_fields = ('type', 'description', 'created_by__username')  # Fields to search through
    ordering = ('-created_at',)  # Order announcements by creation date descending

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'reviewed', 'rating', 'timestamp')
    list_filter = ('rating', 'timestamp')
    search_fields = ('reviewer__username', 'reviewed__user__username', 'comment')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('description', 'user__username')
    list_filter = ('created_at', 'user')

    class Meta:
        model = Project

@admin.register(AnnouncementCategory)
class AnnouncementCategoryAdmin(admin.ModelAdmin):
    list_display = ('name_fr','name_en','name_ar')


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'created_at', 'html_file')  # Columns shown in admin list
    search_fields = ('title', 'slug', 'content')  # Searchable fields
    prepopulated_fields = {'slug': ('title',)}  # Auto-generate slug from title
    ordering = ('-created_at',)