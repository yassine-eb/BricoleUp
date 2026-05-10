from django.urls import path
from .views import *

from rest_framework_simplejwt.views import TokenRefreshView



urlpatterns = [
    path('geo/city/', geo_city, name='geo-city'),
    path('home/', HomeAPI.as_view(), name='api-home'),
    path('annonces/', AnnouncementsAPI.as_view(), name='api-annonces'),
    path('prestataires/', PrestatairesListAPI.as_view(), name='api-prestataires-list'),
    path('annonce/<int:pk>/', AnnouncementDetailAPI.as_view(), name='api-annonce-detail'),
    
    path('project/<int:pk>/', ProjectDetailAPI.as_view(), name='api-project-detail'),

    path('skills/', SkillsAPI.as_view(), name='api-skills'),
    path('cities/', CitiesAPI.as_view(), name='api-cities'),
    path('profile/<slug:slug>/', ProfileAPI.as_view(), name='api-profile'),
    path("account/infos/", account_infos_api, name="api-account-infos"),
    path('favorites/<slug:slug>/favorite/', ToggleFavoriteProfile.as_view(), name='toggle-favorite'),
    path("profil/edit/", edit_profile_api, name="edit_profile_api"),
    path('favorites/', UserFavoritesAPI.as_view(), name='user-favorites'),
    path('create_project/', create_project_api, name='create_project_api'),
    path('login/', jwt_login, name='jwt_login'),
    path('auth/login/', jwt_login, name='jwt_login_alias'),

    path('create_announcement/', create_announcement, name='create_announcement'),
    path('create_announcement_simple/', create_announcement_simple, name='create_announcement_simple'),

    path('register/', jwt_register, name='jwt_register'),
    path('auth/register/', jwt_register, name='jwt_register_alias'),
    path('conversations/', conversations_api, name='conversations_api'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_alias'),

    path('conversations/<slug:slug>/', conversation_detail_api, name='conversation_detail_api'),

    path('auth/admin/users/', AdminUsersAPI.as_view(), name='admin-users'),
    path('auth/admin/stats/', AdminStatsAPI.as_view(), name='admin-stats'),
    path('auth/admin/annonces/', admin_annonces_list, name='admin-annonces-list'),
    path('auth/admin/annonces/<int:pk>/approve/', admin_annonce_approve, name='admin-annonce-approve'),
    path('auth/admin/annonces/<int:pk>/reject/', admin_annonce_reject, name='admin-annonce-reject'),
    path('auth/admin/offres/', admin_offres_list, name='admin-offres-list'),
    path('auth/admin/offres/<int:pk>/accept/', admin_offre_accept, name='admin-offre-accept'),
    path('auth/admin/offres/<int:pk>/refuse/', admin_offre_refuse, name='admin-offre-refuse'),
    path('auth/admin/offres/<int:pk>/delete/', admin_offre_delete, name='admin-offre-delete'),

    path('auth/users/me/', me_api, name='me-api'),
    path('auth/users/me/kyc/', kyc_upload_api, name='kyc-upload'),
    path('auth/users/<int:user_id>/', user_by_id_api, name='user-by-id'),
    path('reviews/user/<int:user_id>/', reviews_by_user_api, name='reviews-by-user'),
    path('reviews/<slug:slug>/', submit_review_api, name='submit-review'),
    path('notifications/', notifications_list_api, name='notifications-list'),
    path('notifications/<int:notif_id>/read/', notification_mark_read_api, name='notification-read'),
    path('notifications/read-all/', notifications_read_all_api, name='notifications-read-all'),
    path('projects/', projects_list_api, name='projects-list'),
    path('my-projects/', my_projects_api, name='my-projects'),
    path('my-projects/<int:project_id>/delete/', my_project_delete_api, name='my-project-delete'),
    path('projects/<int:project_id>/comments/', project_comments_api, name='project-comments'),
    path('projects/comments/<int:comment_id>/delete/', project_comment_delete_api, name='project-comment-delete'),
]
