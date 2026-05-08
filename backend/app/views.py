from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from .models import *
from .forms import *
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.utils.encoding import force_str
from django.core.mail import send_mail
from django.http import JsonResponse

from django.shortcuts import render, get_object_or_404
from math import radians, cos, sin, asin, sqrt

from django.core.exceptions import ObjectDoesNotExist

from django.core.paginator import Paginator

from django.shortcuts import redirect
import datetime

from datetime import datetime
import folium 
from django.urls import reverse





def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    return c * 6371 

def adstxt(request):

    return render(request, 'app/ads.txt')

from datetime import timedelta



@login_required
def delete_age(request):
    if request.method == "POST":
        profile = request.user.profile
        profile.date_naissance = None
        profile.save()
        return JsonResponse({'success': True, 'message': 'Âge supprimé avec succès.'})
    return JsonResponse({'success': False, 'message': 'Requête invalide.'})

@login_required
def delete_adresse(request):
    if request.method == "POST":
        profile = request.user.profile
        profile.adresse = ""
        profile.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})


def delete_review(request, review_id):
    review = get_object_or_404(Review, id=review_id)
    review.delete()
    return redirect('app:account', slug=review.reviewed.user.profile.slug)



@login_required
def delete_profile_picture(request):
    if request.method == 'POST':
        profile = request.user.profile
        profile.profile_picture.delete()
        profile.profile_picture = None
        profile.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@login_required
def update_profile_picture(request, profile_id):
    profile = get_object_or_404(Profile, id=profile_id)

    if request.method == "POST" and request.FILES.get('profile_picture'):
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        return redirect('app:account', slug=profile.slug)

    return redirect('app:account', slug=profile.slug)

@login_required
def update_cover_picture(request, profile_id):
    profile = get_object_or_404(Profile, id=profile_id)

    if request.method == "POST" and request.FILES.get('cover_picture'):
        profile.cover_picture = request.FILES['cover_picture']
        profile.save()
        return redirect('app:account', slug=profile.slug)

    return redirect('app:account', slug=profile.slug)



@login_required
def report_annonce(request, id):
    announcement = get_object_or_404(Announcement, id=id)
    if request.method == 'POST':
        message = request.POST.get('message')

        report = Reportannonce(user=request.user, reported_annonce=announcement, message=message)
        report.save()

    return redirect('app:annonce_details', id=announcement.id)



@login_required
def report_profile(request, profile_id):
    profile = get_object_or_404(Profile, id=profile_id)
    if request.method == 'POST':
        
        message = request.POST.get('message')

        report = Report(user=request.user, reported_profile=profile.user, message=message)
        report.save()

    return redirect('app:account', slug=profile.slug)

 

@login_required
def submit_review(request, slug):
    if request.method == 'POST':
        profile = get_object_or_404(Profile, slug=slug)
        rating = request.POST.get('rating')
        comment = request.POST.get('comment')

        # Create a new Review instance
        Review.objects.create(reviewer=request.user, reviewed=profile, rating=rating, comment=comment)

        # Redirect back to the profile page (or wherever you want)
        return redirect('app:account', slug=slug)

    # Handle GET requests or other methods as needed
    return redirect('app:account', slug=slug)

def delete_announcement(request, id):
    # Retrieve the announcement or return a 404 if not found
    announcement = get_object_or_404(Announcement, id=id)
    
    # Check if the user is the creator of the announcement
    if request.user == announcement.created_by:
        announcement.delete()  # Delete the announcement
       

    return redirect('app:account', slug=request.user.profile.slug) 
def delete_project(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    project.delete()  
       

    return redirect('app:account', slug=request.user.profile.slug) 

@login_required
def add_to_favorites(request, id):
    announcement = get_object_or_404(Announcement, id=id)
    favorite, created = Favorite.objects.get_or_create(user=request.user, announcement=announcement)

    return redirect('app:annonce_details', id=announcement.id)
    

@login_required
def remove_from_favorites(request, id):
    announcement = get_object_or_404(Announcement, id=id)
    favorite = Favorite.objects.filter(user=request.user, announcement=announcement)

    if favorite.exists():
        favorite.delete()
        
    return redirect('app:annonce_details', id=announcement.id)
@login_required
def add_to_favorites_profiles(request, profile_id):
    profile = get_object_or_404(Profile, id=profile_id)
    favorite, created = FavoriteProfile.objects.get_or_create(user=request.user, profile=profile)

    return redirect('app:account', slug=profile.slug)

@login_required
def remove_from_favorites_profiles(request, profile_id):
    profile = get_object_or_404(Profile, id=profile_id)
    favorite = FavoriteProfile.objects.filter(user=request.user, profile=profile)

    if favorite.exists():
        favorite.delete()
        
    return redirect('app:account', slug=profile.slug)


import requests
from django.shortcuts import redirect, render


from django.db.models import Avg
from django.db.models import Avg, Count, Value, FloatField
from django.db.models.functions import Coalesce
from django.db.models import Case, When, Value, IntegerField
from django.db.models import Case, When, Value, IntegerField, F

def account_profil(request):
    

 
     
    context = {
    }

    return render(request, 'app/account_profil.html', context)

from django.db.models import Count
import time
import csv
from django.core.mail import send_mail
from django.conf import settings
import time





def home(request):

    

    if request.user.is_authenticated and request.user.profile.city:
        country = request.user.profile.city.country
    else:
        try:
            country = Country.objects.get(code="FR")
        except Exception:
            country = Country.objects.first()

    cities = City.objects.all().order_by("name_fr")  #country.cities.all().order_by('name_fr')
    skills = Skill.objects.all().order_by("name_fr")
    latest_demandes = Announcement.objects.filter(category__name_fr="Demande de prestation", city__country = country).order_by('-created_at')[:3]
    latest_offres = Announcement.objects.filter(category__name_fr="Offre de services", city__country = country).order_by('-created_at')[:3]
    #latest_vente = Announcement.objects.filter(category__name_fr="Vente de matériel", city__country = country).order_by('-created_at')[:3]
    #latest_location = Announcement.objects.filter(category__name_fr="Location de matériel", city__country = country).order_by('-created_at')[:3]
    latest_projects = Project.objects.filter(user__profile__city__country = country).order_by('-created_at')[:4]

    profiles = (
        Profile.objects.filter(
            type="towork",
            is_verified=True,
            city__country=country,
            city__isnull=False,
            bio__isnull=False,
            profile_picture__isnull=False,
        )
        .exclude(
            bio="",                    # ✅ exclude empty bio
            profile_picture=""         # ✅ exclude empty picture path
        )
        .order_by("-id")[:6]          # ✅ newest first (use "id" if oldest)
    )

    
    context = {
        "skills": skills,
        "cities": cities,
        'latest_demandes':latest_demandes,
        'latest_offres':latest_offres,
        'show_footer': True,
        "latest_projects": latest_projects,
        "profiles" : profiles,
    }

    return render(request, 'app/home.html', context)


def user_login(request):
    if request.user.is_authenticated:
        profile, created = Profile.objects.get_or_create(user=request.user)
        return redirect('app:account', slug=profile.slug)
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password1')
        #user = authenticate(request, email=email, password=password)
        
        try:
            user = User.objects.get(email=email)
        
            username = user.username
            user = authenticate(request, username=username, email=email, password=password)

            profile, created = Profile.objects.get_or_create(user=user)
            if profile :
                    
                    user.save()
                    profile.save()
                    
            login(request, user)
           


            return redirect('app:account_profil')  # Adjust 'home' to your actual homepage URL name
        except:
            message = 'Email ou mot de passe invalide.' 
           

            return render(request, 'app/login.html', {"error_message":message}) #JsonResponse({'success': False, 'error_message': message})

    return render(request, 'app/login.html')


from django_countries import countries
def registration_step1(request):
    if request.user.is_authenticated:
        profile, created = Profile.objects.get_or_create(user=request.user)
        return redirect('app:account', slug=profile.slug)

    if request.method == "POST":


    
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST.get('password2')

        mobile = request.POST.get("mobile")           # raw input (not reliable)
        mobile_full = request.POST.get("mobile_full") # +33612345678 ✅
        country = request.POST.get("mobile_country")  # fr ✅

        print(mobile)       # 0612345678
        print(mobile_full)  # +33612345678
        print(country)      # fr

        if User.objects.filter(username=username).exists():
            message = "Le nom d'utilisateur est déjà utilisé."
           
           
            return render(request, 'app/registration_step1.html', { "error_message": message})

        # Check existing users
        if User.objects.filter(email=email).exists():
            message = "L'email est déjà utilisé."
           
            return render(request, 'app/registration_step1.html', { "error_message": message })
        
        
        # Check existing users
        """ if Profile.objects.filter(phone_number=mobile_full).exists():
            message = "Le numéro est déjà utilisé."
           
            return render(request, 'app/registration_step1.html', { "error_message": message, }) """
        


        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)
        profile, created = Profile.objects.get_or_create(user=user)
        profile.type = "towork" #if request.POST.get('user_choice', 'hire') == "work" else "tohire"
        profile.phone_number = mobile_full
        
        
        profile.save()

        # Log in the user
        login(request, user)
        
        return redirect('app:account_edit')
        
    return render(request, 'app/registration_step1.html')
   

def verify_email_request(request):
    if request.user.is_authenticated:
        user = request.user

        if user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            verification_link = request.build_absolute_uri(
                reverse('app:verify_email', kwargs={'uidb64': uid, 'token': token})
            )

            subject = 'BricoleUp Confirmation de votre adresse email'
            message = f"""
                <html><body>
                <p>Bonjour {user.username} ,</p>
                <p>Veuillez confirmer votre email en cliquant sur le lien ci-dessous :</p>
                <p><a href="{verification_link}">Confirmer votre email</a></p>
                <br><p>Cordialement,</p><p>L'équipe de BricoleUp</p>
                </body></html>
            """
            
            send_mail(
                subject,
                '',
                settings.EMAIL_HOST_USER,
                [user.email],
                html_message=message
            )
            return JsonResponse({'success': True, "message": "L'e-mail de vérification a été envoyé avec succès à votre adresse.\nVeuillez vérifier votre adresse e-mail et actualiser la page pour continuer."})

        else:
            return JsonResponse({'success': False, 'message': 'No email set for user'})
    else:
        return JsonResponse({'success': False, 'message': 'User not authenticated'})


def verify_email(request, uidb64, token):
   
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        profile = Profile.objects.filter(user=user).first()
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
        profile = None

    if user and default_token_generator.check_token(user, token):
        if not profile.is_email_verified:
            profile.is_email_verified = True
            profile.save()

            success_message = "Votre email a été vérifié avec succès."
      

            return render(request, 'app/email_verification.html', {'profile': profile, 'success_message': success_message})

        else:
            message = "Votre email est déjà vérifié."
          
            return render(request, 'app/email_verification.html', {'profile': profile, 'error_message': message})

    else:
        error_message = "Lien de vérification invalide ou expiré."
        
        return render(request, 'app/email_verification.html', {'profile': profile,'error_message': error_message})
   

def forgot_password(request):
    
    if request.method == "POST":
        email = request.POST.get("email")
        user_pass = User.objects.filter(email=email).first()
        if user_pass:
            # Generate password reset token
            uid = urlsafe_base64_encode(force_bytes(user_pass.pk))
            token = default_token_generator.make_token(user_pass)
            
            reset_link = f"https://bricoleup.com/reset_password/{uid}/{token}/"
            

            subject = 'BricoleUp Réinitialisez votre mot de passe'
            message = f"""
            <html>
                <body>
                <p>Bonjour {user_pass.username} ,</p>
                <p>Vous pouvez réinitialiser votre mot de passe en cliquant sur le lien ci-dessous :</p>
                <p><a href="{reset_link}">Réinitialisez votre mot de passe</a></p>
                <br>
                <p>Cordialement,</p>
                <p>L'équipe de BricoleUp</p>
                </body>
            </html>
            """


            send_mail(
                subject,
                '',  # Leave the plain text part empty as we're using HTML email
                settings.EMAIL_HOST_USER,
                [email],
                html_message=message  # Pass the HTML message here
            )

            
    
            return render(request,'app/forgot_password.html',{'email_sent': True,'password_reset':True})
        else:
            message = "Cet email n'est pas enregistré."
            
                            
            # Handle case where email is not found in the database
            return render(request,'app/forgot_password.html', {'error_message': message,'password_reset':True})

    
    return render(request, 'app/forgot_password.html',{'password_reset':True })

def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user and default_token_generator.check_token(user, token):
        # Password reset token is valid, handle password reset logic here
        # You might display a form for users to input a new password

        if request.method == 'POST':
            # Retrieve the new password from the form
            new_password = request.POST.get('new_password')

            # Set the new password for the user
            user.set_password(new_password)
            user.save()

            # Redirect to password reset success page or login page
            authenticated_user = authenticate(request, username=user.username, password=new_password)
            if authenticated_user:
                # If successfully authenticated, log the user in
                login(request, authenticated_user)
            return redirect('app:home') # Replace 'password_reset_done' with your URL name for success

        # Render a password reset form for the user to input a new password
        return render(request, 'app/reset_password.html',{'reset_password':True})  # Replace 'password_reset_form.html' with your form template

    # If the token is invalid or user doesn't exist, show an error or redirect to an error page
    return render(request, 'app/reset_password.html',{'reset_password':True})


def logout_request(request):

    
	    
    logout(request)
    
	
    return redirect("app:home")



from django.core.paginator import Paginator
# from django.contrib.gis.geoip2 import GeoIP2  # requires GDAL system libs
def get_client_ip(request):
    """Gets the real client IP address, even behind reverse proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
def prestataires(request):
    if request.user.is_authenticated and request.user.profile.city:
        country = request.user.profile.city.country
    else:
        try:
            country = Country.objects.get(code="FR")
        except Exception:
            country = Country.objects.first()
    cities = City.objects.all().order_by("name_fr")  #country.cities.all().order_by('name_fr')

    
    


    filters = {
        'sort_by': 'distance',
        'account_type': [],
        'verified': False,
        'search_radius': 50
    }

    if request.method == "POST":
        if 'effacer_filtres' in request.POST:
            # L'utilisateur a cliqué sur "Effacer", on garde les valeurs par défaut
            pass
        else:
            filters['sort_by'] = request.POST.get('sort_by')
            filters['account_type'] = request.POST.getlist('account_type')
            filters['verified'] = request.POST.get('verified') == 'on'
            try:
                search_radius = float(request.POST.get('search_radius', 50))
                filters['search_radius'] = search_radius
            except (TypeError, ValueError):
                filters['search_radius'] = 50
    
    # Fetch skills and cities
    skills = Skill.objects.all().order_by("name_fr")


    # Handle POST request
    selected_location = request.POST.get("location", "")

    # Initialize selected_city variables
    selected_city = None

    if selected_location:
        try:
            selected_city = City.objects.get(id=int(selected_location))
        except :
            pass 
    


    selected_skills = request.POST.get("skills", "").split(",") if request.method == "POST" else None
   
    
    if selected_skills and not selected_skills == [""] :
        skill_ids_list = [skill_id for skill_id in selected_skills if skill_id]  # Remove empty values
        selected_skills = Skill.objects.filter(id__in=skill_ids_list)  # Query skills

        # Extract skill IDs from the queryset
        selected_skill_ids = selected_skills.values_list('id', flat=True)
    else:
        selected_skills = None
        selected_skill_ids = Skill.objects.all().values_list('id', flat=True)
    
    # Fetch profiles matching selected skills
    profiles = Profile.objects.filter(
            type="towork",
            skills__id__in=selected_skill_ids,
            city__country = country,
            city__isnull=False,
            bio__isnull=False,
        ).distinct()
   

    
    if filters['account_type']:
        profiles = profiles.filter(statut__in=filters['account_type'])

    if filters['verified']:
        profiles = profiles.filter(is_verified=True)
    
   
   
    profiles_with_distance = []
    if selected_city:
        for profile in profiles:
            if  profile.latitude and  profile.longitude:
                distance = haversine(
                    selected_city.latitude, selected_city.longitude,
                    profile.latitude, profile.longitude
                )
            else:
                distance = haversine(
                    selected_city.latitude, selected_city.longitude,
                    profile.city.latitude, profile.city.longitude
                )
            # Rayon de recherche (si défini, sinon 100 km par défaut)
            radius = filters['search_radius']
            if distance <= radius:
                profiles_with_distance.append((profile, distance))

        # === Tri selon filtre ===
        if filters['sort_by'] == "rating":
            sorted_profiles = sorted(
                profiles_with_distance,
                key=lambda x: (x[0].average_rating() or 0),
                reverse=True
            )
        else:  # distance par défaut
            sorted_profiles = sorted(profiles_with_distance, key=lambda x: x[1])


        profiles = [p for p, _ in sorted_profiles]
    else:
        profiles = profiles.order_by("-id")
        sorted_profiles = [(p,None) for p in profiles]
        
        
    
    

    paginator = Paginator(sorted_profiles, 10)

    # We do NOT pick a page here because JS will show them
    total_pages = paginator.num_pages

    pages = []
    for number in range(1, total_pages + 1):
        pages.append({
            "number": number,
            "profiles": paginator.page(number).object_list
        })

    context = {
        "pages": pages,
        "total_pages": total_pages,

        'sorted_profiles': sorted_profiles,
        "skills": skills,
        "cities": cities,
        "selected_skills": selected_skills,
        "selected_city": selected_city,
        'filters': filters,
        'show_footer': True,
        'prestataires_page': True,

    }

    if request.headers.get("HX-Request") == "true":
        return render(request, "app/partials/prestataires_results.html",context)
    else:
        return render(request, "app/prestataires.html", context)
    

from django.db.models import Max
from django.db.models import Q

def annonces(request):
    if request.user.is_authenticated and request.user.profile.city:
        country = request.user.profile.city.country
    else:
        try:
            country = Country.objects.get(code="FR")
        except Exception:
            country = Country.objects.first()
    cities = City.objects.all().order_by("name_fr")  # country.cities.all().order_by('name_fr')
        

    filters = {
        'account_type': [],
        'verified': False,
        'categories': [],
    }

    if request.method == "POST":
        if 'effacer_filtres' in request.POST:
            # L'utilisateur a cliqué sur "Effacer", on garde les valeurs par défaut
            pass
        else:
            filters['account_type'] = request.POST.getlist('account_type')
            filters['verified'] = request.POST.get('verified') == 'on'
        

            filters['categories'] = request.POST.getlist('categories')

          

    if filters['categories']:
        CATEGORY_MAP = {
            "demande_prestation": "Demande de prestation",
            "offre_service": "Offre de services",
            "vente_materiel": "Vente de matériel",
            "location_materiel": "Location de matériel",
        }
        categories_name_fr = [CATEGORY_MAP[key] for key in filters['categories'] if key in CATEGORY_MAP]

        #filtered_announcements = filtered_announcements.filter(category__name_fr__in=categories_name_fr)
    
    skills = Skill.objects.all().order_by("name_fr")
    

    selected_skills = request.POST.get("skills", "").split(",") if request.method == "POST" else None
    selected_city = request.POST.get("location") if request.method == "POST" else None

    if selected_skills and not selected_skills == [""] :
        skill_ids_list = [skill_id for skill_id in selected_skills if skill_id]  # Remove empty values
        selected_skills = Skill.objects.filter(id__in=skill_ids_list)  # Query skills

        # Extract skill IDs from the queryset
        skill_ids = selected_skills.values_list('id', flat=True)

    else:
        skill_ids = Skill.objects.all().values_list('id', flat=True)
        selected_skills = None


    filtered_announcements = Announcement.objects.filter(
        Q(skills__id__in=skill_ids) &
        (Q(category__name_fr__in=categories_name_fr) if filters['categories'] else Q()) &
        (Q(created_by__profile__statut__in=filters['account_type']) if filters['account_type'] else Q()) &
        (Q(created_by__profile__is_verified=True) if filters['verified'] else Q())
    ).distinct()

    if selected_city:
        selected_city_obj = City.objects.get(id=selected_city)

        announcements_list = list(filtered_announcements)
        results = []

        for annonce in announcements_list:
            if annonce.city:
                distance = haversine(
                    selected_city_obj.latitude, selected_city_obj.longitude,
                    annonce.city.latitude, annonce.city.longitude
                )
                if distance <= 100:
                    annonce.distance = distance
                    results.append(annonce)

        filtered_announcements = sorted(results, key=lambda x: x.distance)



        
    else:
        selected_city = None 
        if request.user.is_authenticated and request.user.profile.city:
            country = request.user.profile.city.country
        else:
            ip = get_client_ip(request)

            g = GeoIP2()
            try:
                country_code = g.country(ip)['country_code']

                if country_code == "MA":
                    country = Country.objects.get(code="MA")
                elif country_code == "BE":
                    country = Country.objects.get(code="BE")
                else:
                    country = Country.objects.get(code="FR")
            except Exception as e:
                country = Country.objects.get(code="FR")
            

        filtered_announcements = filtered_announcements.filter(city__country=country).order_by('-created_at')
    

    paginator = Paginator(filtered_announcements, 9)

    # We do NOT pick a page here because JS will show them
    total_pages = paginator.num_pages

    pages = []
    for number in range(1, total_pages + 1):
        pages.append({
            "number": number,
            "profiles": paginator.page(number).object_list
        })

    context = {
        "pages": pages,
        "total_pages": total_pages,
    
        'announcements': filtered_announcements,
        'filters': filters,
        'skills': skills,
        'cities': cities,
        'selected_skills': Skill.objects.filter(id__in=selected_skills) if selected_skills else [],
        'selected_city': City.objects.get(id=selected_city) if selected_city else None,
        'show_footer': True,
        'annonces_page': True,
    }
    if request.headers.get("HX-Request") == "true":
        return render(request, "app/partials/annonces_results.html",context)
    else:
        return render(request, "app/annonces.html", context)
    

from django.core.mail import send_mail
from django.conf import settings
from .models import Profile


def notify_profiles_for_announcement(announcement):

    profiles = Profile.objects.filter(
        type="towork",
        city__isnull=False,
    ).select_related("user", "city").distinct()

    profiles_to_send_email = []
    selected_city = announcement.city

    if selected_city:
        for profile in profiles:
            if profile.latitude and profile.longitude:
                distance = haversine(
                    selected_city.latitude,
                    selected_city.longitude,
                    profile.latitude,
                    profile.longitude
                )
            else:
                distance = haversine(
                    selected_city.latitude,
                    selected_city.longitude,
                    profile.city.latitude,
                    profile.city.longitude
                )

            radius = 100
            if distance <= radius:
                profiles_to_send_email.append(profile)

    for profile in profiles_to_send_email:
        recipient = profile.user

        subject = f"Nouvelle annonce proche de vous — Budget: {announcement.budget}€ — Ville: {announcement.city.name_fr}"

        body = f"""
            Bonjour {recipient.username},

            Une nouvelle annonce susceptible de vous intéresser vient d'être publiée.

            Ville : {announcement.city.name_fr}
            Budget : {announcement.budget}
            
            Consultez-la ici :
            https://bricoleup.com/annonce/{announcement.id}/

            Cordialement,
            L'équipe
            """

        send_mail(
            subject,
            body,
            settings.EMAIL_HOST_USER,
            [recipient.email],
            fail_silently=False,
        )


@login_required
def create_announcement(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()
    if not profile.city:
        cities = City.objects.all().order_by("name_fr")
        return render(request, 'app/account_edit.html', {
                'profile': profile,
                "cities": cities,
                'message': "Veuillez compléter vos informations de profil en sélectionnant une ville.",
            })
    
    if request.method == 'POST':
        selected_skill_ids = request.POST.get('skills', '')  # Get skills as a comma-separated string
        selected_skills = []
        
        if selected_skill_ids:
            skill_ids_list = [skill_id for skill_id in selected_skill_ids.split(",") if skill_id]  # Remove empty values
            selected_skills = Skill.objects.filter(id__in=skill_ids_list)  # Query skills


        # **🔴 Check if no skills were selected**
        if not selected_skills:
            return JsonResponse({"success": False, "error_message": "Veuillez sélectionner au moins une compétence."})
        

        selected_type = request.POST.get('statut')  # 'demande_prestation', 'offre_service', etc.

        CATEGORY_MAP = {
            "demande_prestation": "Demande de prestation",
            "offre_service": "Offre de services",
            "vente_materiel": "Vente de matériel",
            "location_materiel": "Location de matériel",
        }

        
        try:
            name_fr = CATEGORY_MAP[selected_type]
            category = AnnouncementCategory.objects.get(name_fr=name_fr)
        except:
            category = None
                
        
            


        description = request.POST.get('description')
        budget_raw = request.POST.get('budget', '').strip()
        a_convenir = request.POST.get('a_convenir') == 'on'

        # If budget is empty or À convenir is checked, set it to None
        if budget_raw == '':
            a_convenir = True
            budget = None
        else:
            try:
                budget = float(budget_raw)
            except ValueError:
                # fallback if user enters invalid input
                a_convenir = True
                budget = None
  
       

        announcement = Announcement.objects.create(
            category=category,
            description=description,
            created_by=request.user,
            city=profile.city,
            a_convenir = a_convenir,
            budget=budget,
           
            image1=request.FILES.get('image1'),
            image2=request.FILES.get('image2'),
            image3=request.FILES.get('image3'),
            image4=request.FILES.get('image4'),
            image5=request.FILES.get('image5'),
            image6=request.FILES.get('image6'),
        )

        # **Associate selected skills**
        for skill in selected_skills:
            announcement.skills.add(skill)

        announcement.save()
       
        return JsonResponse({"success": True, "redirect_url": f"/annonce/{announcement.id}/"})
    skills = sorted(Skill.objects.all(), key=lambda skill: skill.name_fr)
    
    
    
    
    return render(request, 'app/annonce_create.html', {
      
        'skills': skills,
        'selected_city': profile.city,
        'selected_skills': profile.skills.all(),
    })


from django.core.mail import send_mail
from django.conf import settings
from django.contrib import messages
def annonce_details(request, id):
    
    announcement = get_object_or_404(Announcement, id=id)

    is_favorite = False
    profile_is_favorite = False
    if request.user.is_authenticated:
        is_favorite = Favorite.objects.filter(user=request.user, announcement=announcement).exists()
    
        profile_is_favorite = FavoriteProfile.objects.filter(user=request.user, profile=announcement.created_by.profile).exists()

    user_offer = None
    if request.user.is_authenticated:
        user_offer = Offer.objects.filter(
            announcement=announcement,
            sender=request.user
        ).first()
    
    # All offers for the owner
    announcement_offers = None
    if request.user.is_authenticated and request.user == announcement.created_by:
        announcement_offers = Offer.objects.filter(
            announcement=announcement
        ).select_related('sender', 'sender__profile').order_by('-created_at')

   
    
    return render(
        request, 
        'app/annonce_details_new.html', 
        {'profile': announcement.created_by.profile ,
         'user_offer': user_offer,
         'announcement_offers': announcement_offers,
         'profile_is_favorite': profile_is_favorite,
         'is_favorite': is_favorite,
         'announcement': announcement}
    )


@login_required
def accept_offer(request, offer_id):
    offer = get_object_or_404(Offer, id=offer_id)

    if request.user != offer.announcement.created_by:
        messages.error(request, "Action non autorisée.")
        return redirect('app:annonce_details', id=offer.announcement.id)

    offer.status = 'accepted'
    offer.save()
    messages.success(request, f"Vous avez accepté l'offre de {offer.sender.username}.")

    # Email to offer sender
    try:
        send_mail(
            subject="Votre offre a été acceptée sur BricoleUp 🎉",
            message=f"""
Bonjour {offer.sender.username},

Bonne nouvelle ! Votre offre pour l'annonce "{offer.announcement.description[:60]}..." a été acceptée.

Connectez-vous pour contacter le client et finaliser les détails :
https://bricoleup.com/

L'équipe BricoleUp
            """,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[offer.sender.email],
            fail_silently=True,
        )
    except Exception:
        pass


    return redirect('app:annonce_details', id=offer.announcement.id)


@login_required
def reject_offer(request, offer_id):
    offer = get_object_or_404(Offer, id=offer_id)

    if request.user != offer.announcement.created_by:
        messages.error(request, "Action non autorisée.")
        return redirect('app:annonce_details', id=offer.announcement.id)

    offer.status = 'refused'
    offer.save()
    messages.success(request, f"Vous avez refusé l'offre de {offer.sender.username}.")

    # Email to offer sender
    try:
        send_mail(
            subject="Votre offre n'a pas été retenue sur BricoleUp",
            message=f"""
Bonjour {offer.sender.username},

Votre offre pour l'annonce "{offer.announcement.description[:60]}..." n'a pas été retenue par le client.

Ne vous découragez pas, d'autres opportunités vous attendent :
https://bricoleup.com/

L'équipe BricoleUp
            """,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[offer.sender.email],
            fail_silently=True,
        )
    except Exception:
        pass

    return redirect('app:annonce_details', id=offer.announcement.id)


from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect

@login_required
def submit_offer(request, announcement_id):
    announcement = get_object_or_404(Announcement, id=announcement_id)

    if request.method == 'POST':
        if request.user == announcement.created_by:
            messages.error(request, "Vous ne pouvez pas faire une offre sur votre propre annonce.")
            return redirect('app:annonce_details', id=announcement_id)

        price = request.POST.get('price') or None
        message_text = request.POST.get('message', '').strip()
        
        if not message_text or not price:
            messages.error(request, "Le prix et le message sont obligatoires.")
            return redirect('app:annonce_details', id=announcement_id)


        offer, created = Offer.objects.get_or_create(
            announcement=announcement,
            sender=request.user,
            defaults={'price': price, 'message': message_text}
        )

        if not created:
            messages.warning(request, "Vous avez déjà envoyé une offre pour cette annonce.")
        else:
            # Save documents if you have an OfferDocument model
            # for doc in documents:
            #     OfferDocument.objects.create(offer=offer, file=doc)
            messages.success(request, "Votre offre a bien été envoyée !")
            try:
                send_mail(
                    subject=f"Vous avez reçu une nouvelle offre sur BricoleUp",
                    message=f"""
Bonjour {announcement.created_by.username},

{request.user.username} vous a envoyé une offre pour votre annonce "{announcement.description[:60]}...".

Prix proposé : {price} {announcement.city.country.currency}
Message : {message_text}

Consultez et répondez à l'offre ici :
https://bricoleup.com/

L'équipe BricoleUp
                    """,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[announcement.created_by.email],
                    fail_silently=True,
                )
            except Exception:
                pass

    return redirect('app:annonce_details', id=announcement_id)



    


def projets(request):
    projects = Project.objects.all()
    user_profile = None
    if request.user.is_authenticated:
        user_profile, created = Profile.objects.get_or_create(user=request.user)

    if request.user.is_authenticated:
        liked_projects_ids = Project.objects.filter(likes__user=request.user).values_list('id', flat=True)
        liked_comments_ids = Comment.objects.filter(comment_likes__user=request.user).values_list('id', flat=True)
    else:
        liked_projects_ids = None
        liked_comments_ids = None
    context = { 'projects': projects,
                'profile': user_profile,
                'liked_projects_ids': liked_projects_ids,
                'liked_comments_ids': liked_comments_ids,
            }
    return render(request, 'app/projets.html',context)

@login_required
def create_project(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()
    skills = sorted(Skill.objects.all(), key=lambda skill: skill.name_fr)
    if request.method == 'POST':
        
        images = [request.FILES.get(f'image{i}') for i in range(1, 5)]
        uploaded_images = [img for img in images if img]  # Remove None values

        selected_skill_ids = request.POST.get('skills', '')  # Get skills as a comma-separated string
        selected_skills = []
        
        if selected_skill_ids:
            skill_ids_list = [skill_id for skill_id in selected_skill_ids.split(",") if skill_id]  # Remove empty values
            selected_skills = Skill.objects.filter(id__in=skill_ids_list) 


        if not uploaded_images:
            return JsonResponse({"success": False, "error_message": "Veuillez ajouter au moins une image."})
        
        if not selected_skills:
            return JsonResponse({"success": False, "error_message": "Veuillez sélectionner au moins une compétence."})
        

        description = request.POST.get('description')
    
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

        return JsonResponse({"success": True, "redirect_url": f"/project/{project.id}/"})
    
    
    return render(request, 'app/project_create.html', {
        'profile': profile,'skills': skills,
    })


def project_details(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    project.views += 1
    project.save()

    if request.user.is_authenticated:
        liked_projects_ids = Project.objects.filter(likes__user=request.user).values_list('id', flat=True)
        liked_comments_ids = Comment.objects.filter(comment_likes__user=request.user).values_list('id', flat=True)
    else:
        liked_projects_ids = None
        liked_comments_ids = None

    context={'project': project,
            'liked_projects_ids': liked_projects_ids,
            'liked_comments_ids': liked_comments_ids,
            }
    return render(request, 'app/project_details.html',context )


from django.db.models import Count
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from app.models import Profile, Review  # adapte selon ton app
from django.utils import timezone
from datetime import datetime

def account_view(request, slug):


    skills = Skill.objects.all().order_by("name_fr")
  
    profile = get_object_or_404(Profile, slug=slug)
    
    
    if not profile:
        return render(request, 'app/404.html')
    
    
    # Get counts of reviews grouped by rating
    reviews_avis = profile.received_reviews.all().order_by('-timestamp')


    reviews = Review.objects.filter(reviewed=profile)
    rating_counts = reviews.values('rating').annotate(count=Count('id'))

    # Ensure all 1-5 stars are included
    rating_dict = {float(i): 0 for i in range(1, 6)}  # use float keys

    for r in rating_counts:
        rating_dict[float(r['rating'])] = r['count']  # match float rating exactly

    # Convert into a list of dicts for easier looping
    rating_data = []
    total = reviews.count()

    for star in range(5, 0, -1):  # 5 → 1
        count = rating_dict[float(star)]
        percent = (count / total * 100) if total > 0 else 0
        rating_data.append({
            'star': star,
            'count': count,
            'percent': str(round(percent, 2)),  # optional, cleaner %
        })


    
    announcements = Announcement.objects.filter(created_by=profile.user).order_by('-created_at')
    projets = Project.objects.filter(user=profile.user).order_by('-created_at')
   

    if profile.latitude and profile.longitude:
        user_map = folium.Map(location=[profile.latitude, profile.longitude], zoom_start=12,      
        max_zoom=16,          
        min_zoom=5,
        tiles='CartoDB positron',
        )

        # Custom circular image HTML
        html_icon = f"""
        <div style="
            background-color: white;
            border-radius: 50%;
            overflow: hidden;
            width: 50px;
            height: 50px;
            border: 1px solid #fff;
            box-shadow: 0 0 5px rgba(0,0,0,0.3);
        ">
            <img src='{profile.profile_picture_url}' style='width:100%; height:100%; object-fit:cover;'>
        </div>
        """

        # Center the icon on the coordinates
        folium.Marker(
            location=[profile.latitude, profile.longitude],
            icon=folium.DivIcon(
                html=html_icon,
                icon_size=(50, 50),
                icon_anchor=(25, 25),  # center of the 50x50 icon
            ),
            tooltip=profile.user.username,
            
        ).add_to(user_map)
        if profile.radius :
            # Optional: Add visibility circle
            folium.Circle(
                location=[profile.latitude, profile.longitude],
                radius=profile.radius * 1000,
                color='blue',
                fill=True,
                fill_color='blue',
                fill_opacity=0.2,
            ).add_to(user_map)

        map_html = user_map._repr_html_()

    else:
        map_html = None  # If coordinates are missing, don't send a map

    is_favorite = False
    if request.user.is_authenticated:
        is_favorite = FavoriteProfile.objects.filter(user=request.user, profile=profile).exists()

    
   
    context = {
        "skills": skills,
        'is_favorite': is_favorite,
        
        'profile': profile,
        'reviews': reviews_avis,
        'rating_data': rating_data,
        'total_reviews': total,

        'announcements':announcements,
        'map': map_html,
        'projets': projets,
        
    }
    
    return render(request, 'app/account.html', context)



def account_edit(request):
    
    
    user = request.user
    profile = Profile.objects.filter(user=user).first()
  
    if request.method == 'POST':
        profile_picture = request.FILES.get('profile_picture')  # returns None if not uploaded

        if profile_picture:
            profile.profile_picture = profile_picture
        
        cover_picture = request.FILES.get('cover_picture')
        if cover_picture:
            profile.cover_picture = cover_picture

        profile.bio = request.POST.get('bio')
     
        
        selected_skills = request.POST.get('skills', '').strip()  
        selected_skills_list = [s for s in selected_skills.split(',') if s.isdigit()]  

        if selected_skills_list:  
            profile.skills.set(map(int, selected_skills_list))  
        else:
            profile.skills.clear()  


        
        username = request.POST.get("username")
       
        # === Validation ===
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return render(request, 'app/account_edit.html', {
                'profile': profile,
                "cities": City.objects.all().order_by("name_fr"),
                'skills' :Skill.objects.all().order_by("name_fr"),
                'message': "Ce nom d'utilisateur est déjà utilisé.",
            })


     

        # === Save base user info ===
        user.username = username
        user.save()

        # === Save profile type (prestataire / client) ===
        user_choice = request.POST.get('user_choice')
        if user_choice == "work":
            profile.type = "towork"
        elif user_choice == "hire":
            profile.type = "tohire"
        if not profile.is_identity_verified :
            # === Save statut (Particulier / Autoentrepreneur / Entreprise) ===
            statut = request.POST.get("statut")
            profile.statut = statut

            # === Handle specific fields ===
            if statut == "particulier":
                profile.prenom = request.POST.get("prenom")
                profile.nom = request.POST.get("nom")
                profile.gender = request.POST.get("gender")


            elif statut in ["autoentrepreneur", "entreprise"]:
                profile.nom_commercial = request.POST.get("nom_commercial")
                profile.siret = request.POST.get("siret")


        city_id = request.POST.get('location')  

        if city_id:
            try:
                city = City.objects.get(id=city_id)
                profile.city = city
            except City.DoesNotExist:
                pass


        profile.save()
        return redirect('app:account_profil')


    skills = Skill.objects.all().order_by("name_fr")
    cities = City.objects.all().order_by("name_fr")


    context = {
        'profile': profile,
        'skills' :skills,
        'cities': cities,
    }
    return render(request, 'app/account_edit.html', context)
   
@login_required
def account_infos(request):
    
   
    user = request.user
    profile = Profile.objects.filter(user=user).first()
    

    cities = City.objects.all().order_by("name_fr")
    if request.method == "POST":
        statut = request.POST.get("statut")
        username = request.POST.get("username")
        email = request.POST.get("email")
        phone_number = request.POST.get("phone_number")

        # === Validation ===
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return render(request, 'app/account_infos.html', {
                'profile': profile,
                "cities": cities,
                'message': "Ce nom d'utilisateur est déjà utilisé.",
            })

        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return render(request, 'app/account_infos.html', {
                'profile': profile,
                "cities": cities,
                'message': "Cet email est déjà utilisé.",
            })

        if phone_number and Profile.objects.filter(phone_number=phone_number).exclude(user=user).exists():
            return render(request, 'app/account_infos.html', {
                'profile': profile,
                "cities": cities,
                'message': "Ce numéro de téléphone est déjà utilisé.",
            })

        # === Save base user info ===
        user.username = username
        user.email = email
        user.save()

        # === Save profile type (prestataire / client) ===
        user_choice = request.POST.get('user_choice')
        if user_choice == "work":
            profile.type = "towork"
        elif user_choice == "hire":
            profile.type = "tohire"

        # === Save statut (Particulier / Autoentrepreneur / Entreprise) ===
        profile.statut = statut
        profile.phone_number = phone_number

        # === Handle specific fields ===
        if statut == "particulier":
            profile.prenom = request.POST.get("prenom")
            profile.nom = request.POST.get("nom")
            profile.date_naissance = request.POST.get("date_naissance") or None
            profile.gender = request.POST.get("gender")


        elif statut in ["autoentrepreneur", "entreprise"]:
            profile.nom_commercial = request.POST.get("nom_commercial")
            profile.siret = request.POST.get("siret")
            profile.date_creation = request.POST.get("date_creation") or None


        city_id = request.POST.get('location')  

        if city_id:
            try:
                city = City.objects.get(id=city_id)
                profile.city = city
            except City.DoesNotExist:
                pass

        profile.save()

        
        return render(request, 'app/account_infos.html', {
            'profile': profile,
            "cities": cities,
            'message_succ': "Les modifications ont été enregistrées avec succès.",
        })

    
    return render(request, 'app/account_infos.html', {
        'profile': profile,
        "cities": cities,
    })

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def my_announcements(request, slug):
    profile = get_object_or_404(Profile, slug=slug)
    announcements = Announcement.objects.filter(created_by=profile.user).order_by('-created_at')

    context = {
        'profile': profile,
        'announcements':announcements,
        
    }

    return render(request, 'app/account/my_announcements.html', context)


@login_required
def my_projects(request, slug):
    profile = get_object_or_404(Profile, slug=slug)
    projets = Project.objects.filter(user=profile.user).order_by('-created_at')

    context = {
        'profile': profile,
        'projets': projets,
        
    }

    return render(request, 'app/account/my_projects.html', context)


@login_required
def sent_offers(request):
    return render(request, 'app/account/offers_sent.html')


@login_required
def received_offers(request):
    return render(request, 'app/account/offers_received.html')


@login_required
def favorite_profiles(request):
     
    # Favorite profiles
    profiles = Profile.objects.filter(favorited_prodiles_by__user=request.user).distinct()
  
    return render(request, 'app/account/favorite_profiles.html', {
        'profiles': profiles,
       
    })


@login_required
def favorite_announcements(request):
    # Favorite announcements
    announcements = Announcement.objects.filter(favorited_by__user=request.user).distinct()
    
    return render(request, 'app/account/favorite_announcements.html', {
        'announcements': announcements,       
    })


@login_required
def verify_email(request):
    profile = request.user.profile
    return render(request, 'app/account/verify_email.html',{
        'profile': profile,
    })


@login_required
def verify_phone(request):
    profile = request.user.profile
     

    return render(request, 'app/account/verify_phone.html',{
        'profile': profile,
        
    })


@login_required
def verify_identity(request):
    profile = request.user.profile

    return render(request, 'app/account/verify_identity.html', {
        'profile': profile,
    }) 



def zone_d_intervention(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()
    
    if request.method == "POST":
        
        city_id = request.POST.get("location")
        
        if city_id:
            
            city = City.objects.get(id=city_id)
            profile.city = city
            profile.save()

            return redirect('app:zone_d_intervention')
        latitude = request.POST.get('latitude')
        longitude = request.POST.get('longitude')
        radius = request.POST.get('radius')  
        if radius:
            profile.radius = float(radius.replace(",", "."))

        if latitude and longitude:  
            try:
                profile.latitude = float(latitude.replace(",", "."))
                profile.longitude = float(longitude.replace(",", "."))
                profile.save()
            except:
                profile.latitude = profile.city.latitude
                profile.longitude = profile.city.longitude
                profile.save()
     
        profile.save()
        return redirect('app:account', slug=profile.slug)
                
    if not profile.city :
        cities = City.objects.all().order_by("name_fr")
        return render(request, 'app/account_edit.html', {
            'profile': profile,
            'cities': cities,
            'message': "Veuillez sélectionner votre ville pour continuer.",
        })
    
    if profile.city and (not profile.latitude or not profile.longitude):
        
        profile.latitude = profile.city.latitude
        profile.longitude = profile.city.longitude
        profile.save()
    return render(request, 'app/account_zone_d_intervention.html', {'profile': profile})


from django.db.models import Q, Max


@login_required
def messages_convo(request):
    user = request.user
    profile = Profile.objects.filter(user=user).first()

    # Get all conversations where the user is either user1 or user2
    conversations = Conversations.objects.filter(
        Q(user1=user) | Q(user2=user)
    ).annotate(
        last_message_time=Max("messages__timestamp")  # add last message timestamp for sorting
    ).order_by("-last_message_time")

    # Build a dictionary of partners and their last messages
    conversation_partners = {}
    for convo in conversations:
        partner = convo.user1 if convo.user2 == user else convo.user2
        last_message = convo.messages.order_by("-timestamp").first()
        if last_message:
            partner.last_message = last_message
            conversation_partners[partner.profile.slug] = partner

    context = {
        "conversation_partners": conversation_partners,
        "profile": profile,
        "messages_page": True,
    }
    return render(request, "app/messages.html", context)


@login_required
def messages_details(request, recipient_slug):

    recipient = get_object_or_404(User, profile__slug=recipient_slug)
    user = request.user

    # Try to get an existing conversation
    conversation = Conversations.objects.filter(
        models.Q(user1=user, user2=recipient) |
        models.Q(user1=recipient, user2=user)
    ).first()

    # Handle new message POST
    if request.method == 'POST':
        if not conversation:
            # Create conversation only when sending first message
            if user.id < recipient.id:
                conversation = Conversations.objects.create(user1=user, user2=recipient)
            else:
                conversation = Conversations.objects.create(user1=recipient, user2=user)

        message_body = request.POST.get('body')
        message_file = request.FILES.get('file')

        annonce_title = request.POST.get('annonce_title')
        annonce_url = request.POST.get('annonce_url')

        if message_body or (annonce_title and annonce_url):
            full_message_body = message_body or ""
            if annonce_title and annonce_url:
                annonce_info = f'<p><strong><a href="{annonce_url}" >{annonce_title}</a></strong></p>'
                full_message_body = f'{annonce_info}<p>{message_body}</p>' if message_body else annonce_info

            Message.objects.create(
                conversation=conversation,
                sender=user,
                body=full_message_body,
                file=message_file,
                timestamp=timezone.now()
            )
            
            # Lien vers la plateforme
            plateforme_link = "https://bricoleup.com/"

            # Sujet et contenu
            subject = "Vous avez un message non lu sur BricoleUp"
            body = f"""
                Bonjour {recipient.username},

                Vous avez reçu un message non lu sur BricoleUp.

                Consultez la plateforme ici : {plateforme_link}

                L'équipe BricoleUp
                """

            # Envoyer l'email texte
            send_mail(
                subject,
                body,
                settings.EMAIL_HOST_USER,
                [recipient.email],
                fail_silently=False,
            )


    messages = []
    if conversation:
        # Mark recipient messages as read
        Message.objects.filter(
            conversation=conversation,
            sender=recipient,
            is_read=False
        ).update(is_read=True)

        # Get all messages
        messages = conversation.messages.all().order_by('timestamp')

    context = {"recipient": recipient, "messages": messages, "conversation": conversation}

    if request.headers.get("HX-Request") == "true":
        return render(request, 'app/partials/messages_results.html', context)
    return render(request, "app/messages_details.html", context)

   

@login_required
def conversation(request, recipient_slug):
    recipient = get_object_or_404(User, profile__slug=recipient_slug)
    

    if request.method == 'POST':
        message_body = request.POST.get('body')
        message_file = request.FILES.get('file')

        annonce_title = request.POST.get('annonce_title')
        annonce_url = request.POST.get('annonce_url')

        if annonce_title and annonce_url:
            # Prepend the annonce info as a link at the top of the message
            annonce_info = f'<p><strong><a href="{annonce_url}" >{annonce_title}</a></strong></p>'
            full_message_body = f'{annonce_info}<p>{message_body}</p>'

            Message.objects.create(
                sender=request.user,
                recipient=recipient,
                body=full_message_body,
                file=message_file,
                timestamp=timezone.now()
            )
            return redirect('app:conversation', recipient_slug=recipient_slug)
        if message_body:
            Message.objects.create(
                sender=request.user,
                recipient=recipient,
                body=message_body,
                file=message_file,
                timestamp=timezone.now()
            )
        
    
        

        return redirect('app:conversation', recipient_slug=recipient_slug)

   
    try:
        if recipient == request.user:
            last_message = Message.objects.filter(
                models.Q(sender=request.user) | models.Q(recipient=request.user)
            ).exclude(
                models.Q(sender=request.user) & models.Q(recipient=request.user)
            ).order_by('-timestamp').first()

            if last_message:
                
                if last_message.sender == request.user:
                    recipient = last_message.recipient
                else:
                    recipient = last_message.sender
                
                


                return redirect('app:conversation', recipient_slug=recipient.profile.slug)
            else:
                return render(request, 'app/conversation.html', {'no_messages': True, })
    except:
        pass 

    Message.objects.filter(
                        models.Q(sender=recipient, recipient=request.user)
                    ).update(is_read=True)
                    

    messages = Message.objects.filter(
        (models.Q(sender=request.user) & models.Q(recipient=recipient)) |
        (models.Q(sender=recipient) & models.Q(recipient=request.user))
    ).order_by('timestamp')

 

    user = request.user
    profile = Profile.objects.filter(user=user).first()
    conversations = Message.objects.filter(
        models.Q(sender=request.user) | models.Q(recipient=request.user)
    ).select_related('sender', 'recipient').distinct()

    conversation_partners = {}
    for message in conversations:
        partner = message.sender if message.sender != request.user else message.recipient
        if partner.profile.slug not in conversation_partners:
            last_message = Message.objects.filter(
                models.Q(sender=partner, recipient=request.user) |
                models.Q(sender=request.user, recipient=partner)
            ).order_by('-timestamp').first()
            partner.last_message = last_message
            conversation_partners[partner.profile.slug] = partner
    sorted_conversation_partners = dict(sorted(conversation_partners.items(), key=lambda item: item[1].last_message.timestamp, reverse=True))

    context = {
        'recipient': recipient,
        'messages': messages,
        'profile': profile,
        'conversation_partners': sorted_conversation_partners,
    }
    return render(request, 'app/conversation.html', context)

def notifications(request):
    user_profile = None
    unread_messages_count= None
    unread_notifications= None
    notifications= None
    if request.user.is_authenticated:
        user_profile, created = Profile.objects.get_or_create(user=request.user)
        
        user = User.objects.get(id=request.user.id)
    
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)

        unread_notifications = Notification.objects.filter(user=request.user, is_read=False).count()
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')

        
        
    context = {
                'profile': user_profile,
                'unread_messages_count':  unread_messages_count,
                'unread_notifications':unread_notifications,
                'notifications':notifications,

            }
    return render(request, 'app/notifications.html',context)


@login_required
def my_favorites(request):
    # Favorite announcements
    announcements = Announcement.objects.filter(favorited_by__user=request.user).distinct()
    
    # Favorite profiles
    profiles = Profile.objects.filter(favorited_prodiles_by__user=request.user).distinct()
    return render(request, 'app/my_favorites.html', {
        'announcements': announcements,
        'profiles': profiles,
       
    })

from django.http import JsonResponse
from django.utils import timezone


from django.conf import settings
from django.contrib import messages as django_messages

def format_phone_number(raw_number, country_code):
    # Keep digits only
    number = ''.join(filter(str.isdigit, raw_number))

    if country_code == "MA":
        # Moroccan mobiles often start with 06 or 07
        if number.startswith("0"):
            number = number[1:]
        return "+212" + number
    elif country_code == "FR":
        if number.startswith("0"):
            number = number[1:]
        return "+33" + number
    
    return number  # fallback if you add more countries later
    


@login_required
def account_verification(request):
    profile = request.user.profile
    incomplete = False

    

    # Particulier required fields
    if profile.statut == "particulier":
        if not profile.gender or not profile.prenom or not profile.nom:
            incomplete = True

    # Entreprise required fields
    elif profile.statut == "entreprise":
        if not profile.nom_commercial or not profile.siret :
            incomplete = True

    if incomplete:
        cities = City.objects.all().order_by("name_fr")
        return render(request, 'app/account_edit.html', {
            'profile': profile,
            'cities': cities,
            'skills' :Skill.objects.all().order_by("name_fr"),
            'message': "Complétez vos informations avant de passer à la vérification.",
        })
    

    verif_phone_number = format_phone_number(profile.phone_number, profile.city.country.code)
    if request.method == "POST":
        
        if request.FILES.get("piece_identite"):
            profile.piece_identite = request.FILES["piece_identite"]

        if request.FILES.get("document_entreprise"):
            profile.document_entreprise = request.FILES["document_entreprise"]

        
        profile.save()

        return redirect("app:start_identity_payment")
        

    return render(request, "app/account_verification.html", {
        "profile": profile,
        "verif_phone_number":verif_phone_number
    })
# views.py
import stripe
from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse

stripe.api_key = settings.STRIPE_PRIVATE_KEY

def start_identity_payment(request):
    profile = request.user.profile

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": "Vérification d'identité BricoleUp",
                    "description": "Vérification de votre identité et documents - Remboursable en cas de refus"
                },

                "unit_amount": 199,  # 1.99€
            },
            "quantity": 1,
        }],
        metadata={
            "profile_id": profile.id,
            "type": "identity_verification",
        },
        success_url=request.build_absolute_uri(
            reverse("app:verification_success")
        ) + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=request.build_absolute_uri(
            reverse("app:verify_identity")
        ),
    )

    return redirect(session.url)

from django.http import HttpResponse
from django.shortcuts import render
import stripe
from django.conf import settings
from .models import Profile

stripe.api_key = settings.STRIPE_PRIVATE_KEY


def verification_success(request):
    session_id = request.GET.get("session_id")

    if not session_id:
        return HttpResponse("Session Stripe manquante.", status=400)

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception:
        return HttpResponse("Erreur vérification paiement.", status=400)

    # ✅ Check payment status
    if session.payment_status == "paid":
        profile_id = session.metadata.get("profile_id")

        try:
            profile = Profile.objects.get(id=profile_id)
            profile.is_identity_verified_request = True
            
            profile.save()
        except Profile.DoesNotExist:
            return HttpResponse("Profil introuvable.", status=404)

        return redirect("app:verify_identity")

    return HttpResponse("Le paiement n'a pas été complété.", status=400)


from datetime import timedelta


from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from .models import Conversations, Message

def send_unread_message_notifications(profile):
    """
    Envoie un email aux utilisateurs qui ont reçu un message non lu de ce profil.
    """
    # Toutes les conversations où l'utilisateur est user1 ou user2
    conversations = Conversations.objects.filter(
        models.Q(user1=profile.user) | models.Q(user2=profile.user)
    )

    for conv in conversations:
        # Tous les messages envoyés par l'utilisateur dans cette conversation
        messages_sent = conv.messages.filter(sender=profile.user, is_read=False, email_sent=False)

        for msg in messages_sent:
            # Déterminer le destinataire
            recipient = conv.user2 if conv.user1 == profile.user else conv.user1

            # Lien vers la plateforme
            plateforme_link = "https://bricoleup.com/"

            # Sujet et contenu
            subject = "Vous avez un message non lu sur BricoleUp"
            body = f"""
            Bonjour {recipient.username},

            Vous avez reçu un message non lu de {profile.user.username} sur BricoleUp.

            Consultez la plateforme ici : {plateforme_link}

            L'équipe BricoleUp
            """

            # Envoyer l'email texte
            send_mail(
                subject,
                body,
                settings.EMAIL_HOST_USER,
                [recipient.email],
                fail_silently=False,
            )






def politique(request):
    context = { }
    return render(request, 'app/politique.html',context)

def conditions(request):
    context = { }
    return render(request, 'app/conditions.html',context)


def centre_d_aide(request):
    blogs = Blog.objects.all()
    return render(request, 'app/centre_d_aide.html', {'blogs': blogs})

def blog_detail(request, slug):
    blog = get_object_or_404(Blog, slug=slug)
    return render(request, f'app/blog/{blog.html_file}.html', {'blog': blog})


def contact(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')

        # Validate required fields
        if name and email and subject and message:
      
            subject_email_user = 'Merci de nous avoir contacté BricoleUp!'
            body_email_user = (
                f'Bonjour {name},\n\n'
                f'Merci de nous avoir contactés! Voici un résumé de votre message:\n\n'
                f'Sujet: {subject}\n'
                f'Message: {message}\n\n'
                'Nous vous répondrons bientôt.\n\n'
                'Cordialement,\n'
                'L’équipe BricoleUp'
            )

            subject_email_admin = 'Objet: Nouvelle soumission du formulaire de contact BricoleUp'
            body_email_admin = (
                f'Nom: {name}\n'
                f'Sujet: {subject}\n'
                f'Email: {email}\n'
                f'Message: {message}'
            )


            try:
               

                send_mail(
                    subject_email_admin,
                    body_email_admin,
                    settings.EMAIL_HOST_USER,  # Sender's email
                    ["bakadir.oussama@gmail.com"],  # List of recipient emails
                    fail_silently=False,
                )

                messages_succ = 'Merci pour votre message ! Nous vous répondrons bientôt.'

                context = {"messages_succ":messages_succ}
                return render(request, 'app/contact.html', context)
               
            except Exception as e:
                message = "Une erreur s'est produite...."
             

                context = {"messages":message}
                return render(request, 'app/contact.html', context)
        else:
         
            messages = 'Veuillez remplir tous les champs.'

            context = {"messages":messages}
            return render(request,"app/contact.html",context)
    
    
    return render(request, 'app/contact.html')


def plan_du_site(request):
   
    skills = sorted(Skill.objects.prefetch_related('subskills__subsubskills').all(), key=lambda skill: skill.name_fr)
    cities = sorted(City.objects.all(), key=lambda city: city.name_fr)
    announcementcategory = sorted(AnnouncementCategory.objects.all(), key=lambda announcementcategory: announcementcategory.name_fr)
   
    context = {
        'skills': skills,
        'cities': cities,
        'announcementcategory':announcementcategory,
    }

    return render(request, 'app/plan_du_site.html', context)



# core/firebase.py (for example)

import firebase_admin
from firebase_admin import credentials, auth

cred = credentials.Certificate("app/phone-bricoleup-firebase-adminsdk-fbsvc-28f7359a0a.json")
firebase_admin.initialize_app(cred)

# views.py
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from firebase_admin import auth as firebase_auth

from django.contrib.auth import get_user_model
User = get_user_model()

@login_required
def verify_phone_token(request):
    if request.method == "POST":
        data = json.loads(request.body)
        id_token = data.get("token")

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            phone_number = decoded_token.get("phone_number")

            # Prevent two users sharing same verified number
            #if User.objects.filter(profile__phone_number=phone_number, profile__is_phone_verified=True).exclude(id=request.user.id).exists():
                #return JsonResponse({"status": "error", "message": "Numéro déjà utilisé"}, status=400)

            profile = request.user.profile
            
            profile.is_phone_verified = True
            profile.save()

            return JsonResponse({"status": "success"})

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

@login_required
def update_phone(request):
    if request.method == "POST":

        phone = request.POST.get("mobile")
        password = request.POST.get("password")

        user = request.user

        if password != user.password:
            return render(request, "app/account/verify_phone.html", {
                "error_message": "Mot de passe incorrect",
                'profile': request.user.profile,
            })

        # save new phone
        profile = user.profile
        profile.phone_number = phone
        profile.is_phone_verified = False  # reset verification
        profile.is_verified = False
        profile.save()

        return redirect("app:verify_phone")

    return redirect("app:verify_phone")


from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

User = get_user_model()

@login_required
def update_infos(request):

    user = request.user
    profile = user.profile
    if request.method == "POST":

        password = request.POST.get("password2")
        user = request.user

        # ✅ check password
        if not user.check_password(password):
            return render(request, "app/account/verify_identity.html", {
                "error_message": "Mot de passe incorrect",
                "profile": user.profile,
            })
        
        siret = request.POST.get("siret")

        if siret and len(siret) > 20:
            return render(request, "app/account/verify_identity.html", {
                "error_message": "Le numéro SIRET ne doit pas dépasser 20 caractères",
                "profile": profile,
            })



        statut = request.POST.get("statut")
        profile.statut = statut

        # === Handle specific fields ===
        if statut == "particulier":
            profile.prenom = request.POST.get("prenom")
            profile.nom = request.POST.get("nom")
            profile.gender = request.POST.get("gender")


        elif statut in ["autoentrepreneur", "entreprise"]:
            profile.nom_commercial = request.POST.get("nom_commercial")
            profile.siret = request.POST.get("siret")

        profile.is_identity_verified_request = False  # reset verification status on info change
        profile.is_identity_verified = False
        profile.is_verified = False
        profile.save()

    return redirect("app:verify_identity")

@login_required
def update_email(request):

    if request.method == "POST":

        email = request.POST.get("email")
        password = request.POST.get("password2")

        user = request.user

        # ✅ check password
        if not user.check_password(password):
            return render(request, "app/account/verify_email.html", {
                "error_message": "Mot de passe incorrect",
                "profile": user.profile,
            })

        # ❌ empty email
        if not email:
            return render(request, "app/account/verify_email.html", {
                "error_message": "Adresse e-mail invalide",
                "profile": user.profile,
            })

        # ❌ invalid format
        try:
            validate_email(email)
        except ValidationError:
            return render(request, "app/account/verify_email.html", {
                "error_message": "Adresse e-mail invalide",
                "profile": user.profile,
            })

        # ❌ already used
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return render(request, "app/account/verify_email.html", {
                "error_message": "Cette adresse e-mail est déjà utilisée",
                "profile": user.profile,
            })

        # ✅ save email
        user.email = email
        user.save()
        profile = user.profile
        profile.is_email_verified = False
        profile.is_verified = False
        profile.save()

        return redirect("app:verify_email")  # or profile page

    return redirect("app:verify_email")

