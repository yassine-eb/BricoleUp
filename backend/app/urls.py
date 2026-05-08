from django.urls import path , include
from . import views
from django.conf import settings
from django.conf.urls.static import static

app_name = 'app'
urlpatterns = [
    path('ads.txt', views.adstxt, name='adstxt'),

    path('', views.home, name='home'),

    # Annonces & réalisations
    path('mes-annonces/<slug:slug>/', views.my_announcements, name='my_announcements'),
    path('mes-realisations/<slug:slug>/', views.my_projects, name='my_projects'),

    # Offres

    path('annonce/<int:announcement_id>/offre/', views.submit_offer, name='submit_offer'),

    path('offre/<int:offer_id>/accepter/', views.accept_offer, name='accept_offer'),
    path('offre/<int:offer_id>/refuser/',  views.reject_offer,  name='reject_offer'),

    path('offres/envoyees/', views.sent_offers, name='sent_offers'),
    path('offres/recues/', views.received_offers, name='received_offers'),

    # Favoris
    path('favoris/profils/', views.favorite_profiles, name='favorite_profiles'),
    path('favoris/annonces/', views.favorite_announcements, name='favorite_announcements'),

    # Vérification
    path('verification/email/', views.verify_email, name='verify_email'),
    path('verification/telephone/', views.verify_phone, name='verify_phone'),
    path('verification/identite/', views.verify_identity, name='verify_identity'),
    path("update-phone/", views.update_phone, name="update_phone"),
    path("update-email/", views.update_email, name="update_email"),
    path("update-infos/", views.update_infos, name="update_infos"),
    path('start_identity_payment/', views.start_identity_payment, name='start_identity_payment'),
    path('verification_success/', views.verification_success, name='verification_success'),
    path('projets/', views.projets, name='projets'),
    path('centre_d_aide/', views.centre_d_aide, name='centre_d_aide'),
    path('politique-de-confidentialite/', views.politique, name='politique'),
    path('conditions/', views.conditions, name='conditions'),
    path('connexion/', views.user_login, name='user_login'),
    path("logout/", views.logout_request, name= "logout"),
    path("account_infos/", views.account_infos, name= "account_infos"),
    path("account_edit/", views.account_edit, name= "account_edit"),
    path("account_verification/", views.account_verification, name= "account_verification"),
 
    path('verify-email-request/', views.verify_email_request, name='verify_email_request'),
    
    path('delete-adresse/', views.delete_adresse, name='delete_adresse'),


    path('delete-age/', views.delete_age, name='delete_age'),

    path("verify-phone-token/", views.verify_phone_token, name="verify_phone_token"),


    path("zone_d_intervention/", views.zone_d_intervention, name="zone_d_intervention"),

    path('mesfavoris/', views.my_favorites, name='my_favorites'),
    path('annonces/', views.annonces, name='annonces'),
    path('contact/', views.contact, name='contact'),
    path('delete-profile-picture/', views.delete_profile_picture, name='delete_profile_picture'),
    path('profil/', views.account_profil, name='account_profil'),
    # urls.py
    

    #path("select-country-language/", views.select_country_language, name="select_country_language"),
    
  

    path('notifications/', views.notifications, name='notifications'),
    
    path('messages/', views.messages_convo, name='messages'),

    path('plan_du_site/', views.plan_du_site, name='plan_du_site'),
    path('prestataires/', views.prestataires, name='prestataires'),

    
    path('messages/details/<slug:recipient_slug>/', views.messages_details, name='messages_details'),

    path('update-profile-picture/<int:profile_id>/', views.update_profile_picture, name='update_profile_picture'),
    path('update-cover-picture/<int:profile_id>/', views.update_cover_picture, name='update_cover_picture'),

   

    path('centre_d_aide/<slug:slug>/', views.blog_detail, name='blog_detail'),

    path("inscription/", views.registration_step1, name="registration_step1"),

    
    path('report/profile/<int:profile_id>/', views.report_profile, name='report_profile'),
    path('report/annonce/<int:id>/', views.report_annonce, name='report_annonce'),
   
    path('verify_email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),


    #path('messages/<slug:recipient_slug>/', views.conversation, name='conversation'),

    path('account/<slug:slug>/review/', views.submit_review, name='submit_review'),
    path('forgot_password/', views.forgot_password, name="forgot_password"),
    path('reset_password/<uidb64>/<token>/', views.reset_password, name='reset_password'),

    path('annonces/nouveau/', views.create_announcement, name='create_announcement'),
    path('annonces/delete/<int:id>/', views.delete_announcement, name='delete_announcement'),
    path('annonce/<int:id>/', views.annonce_details, name='annonce_details'),

    path('favorites/add/<int:id>/', views.add_to_favorites, name='add_to_favorites'),
    path('favorites/remove/<int:id>/', views.remove_from_favorites, name='remove_from_favorites'),

    path('favoritesprofile/add/<int:profile_id>/', views.add_to_favorites_profiles, name='add_to_favorites_profiles'),
    path('favoritesprofile/remove/<int:profile_id>/', views.remove_from_favorites_profiles, name='remove_from_favorites_profiles'),

    

    
    path('project/nouveau/', views.create_project, name='create_project'),

    path('project/delete/<int:project_id>/', views.delete_project, name='delete_project'),
    path('project/<int:project_id>/', views.project_details, name='project_details'),

        
    path('review/delete/<int:review_id>/', views.delete_review, name='delete_review'),


    path('<slug:slug>/', views.account_view, name='account'),
    
   

]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)