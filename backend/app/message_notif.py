    user = request.user
    profile = Profile.objects.filter(user=user).first()
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


plateforme_link = "https://bricoleup.com/"

    profiles = Profile.objects.select_related("user").all()
    count = 0

    for profile in profiles:
        if not (
            profile.is_email_verified and
            profile.is_phone_verified and
            profile.is_identity_verified
        ):
            recipient = profile.user

            subject = "🔐 Vérifiez votre compte BricoleUp"

            body = f"""
            Bonjour {recipient.username},

            Votre compte BricoleUp n’est pas encore entièrement vérifié.

            La vérification renforce la confiance sur la plateforme et permet aux autres utilisateurs de collaborer avec vous en toute sécurité.

            👉 Connectez-vous ici pour compléter vos informations :
            {plateforme_link}

            Merci de faire partie de la communauté BricoleUp 🤝

            L'équipe BricoleUp
            """

            send_mail(
                subject,
                body,
                settings.EMAIL_HOST_USER,
                [recipient.email],
                fail_silently=False,
            )
            count += 1



plateforme_link = "https://bricoleup.com/"
    sent_count = 0

    profiles = Profile.objects.filter(type="towork").select_related("user")

    for profile in profiles:
        missing_picture = not profile.profile_picture
        missing_bio = not profile.bio or profile.bio.strip() == ""
        missing_skills = profile.skills.count() == 0
        missing_zone = not profile.latitude or not profile.longitude or not profile.radius

        if missing_picture or missing_bio or missing_skills:
            recipient = profile.user

            subject = "Votre profil BricoleUp n’est pas encore complet — boostez-le 🚀"

            body = f"""
                    Bonjour {recipient.username},

                    Votre profil BricoleUp est visible par des clients potentiels, mais il manque encore des informations importantes.

                    Compléter votre profil augmente vos chances d’être contacté et renforce la confiance sur la plateforme.

                    📌 Éléments à compléter :
                    {"- Photo de profil\n" if missing_picture else ""}{"- Description (bio)\n" if missing_bio else ""}{"- Compétences\n" if missing_skills else ""}{"- Zone d’intervention (carte & rayon)\n" if missing_zone else ""}

                    👉 Complétez votre profil ici :
                    {plateforme_link}

                    Plus votre profil est complet, plus vous recevez d'opportunités 💼

                    L'équipe BricoleUp
                    """

            try:
                send_mail(
                    subject,
                    body,
                    settings.EMAIL_HOST_USER,
                    [recipient.email],
                    fail_silently=False,
                )
                sent_count += 1
                print(recipient.email)
            except:
                pass
    

plateforme_link = "https://bricoleup.com/"
    sent_count = 0

    profiles = Profile.objects.filter(type="towork").select_related("user")

    for profile in profiles:
        
        missing_bio = not profile.bio or profile.bio.strip() == ""
        missing_skills = profile.skills.count() == 0

        if missing_bio or missing_skills:
            recipient = profile.user

            subject = "Votre profil n'est pas visible dans la recherche des prestataires pour les clients"
            body = f"""
Bonjour {recipient.username},

Nous avons remarqué que votre profil sur BricoleUp n'est pas complet. 
Pour être visible dans les résultats de recherche des prestataires pour les clients, nous vous invitons à compléter votre présentation et à ajouter vos services.

Cliquez ici pour mettre à jour votre profil :
{plateforme_link}

L'équipe BricoleUp
            """

            try:
                send_mail(
                    subject,
                    body,
                    settings.EMAIL_HOST_USER,
                    [recipient.email],
                    fail_silently=False,
                )
                sent_count += 1
                print(f"Email envoyé à {recipient.email}")
            except Exception as e:
                print(f"Erreur lors de l'envoi à {recipient.email}: {e}")
    print(sent_count) 


plateforme_link = "https://bricoleup.com/"
    sent_count = 0

    profiles = (
        Profile.objects
        .filter(type="towork")
        .select_related("user")
        .order_by("-id")   # du plus grand au plus petit
    )

    for profile in profiles:
        
        recipient = profile.user

        subject = "Publiez votre annonce en 1 minute ⏱️"
        body = f"""
Bonjour {{username}},

Saviez-vous que publier une annonce augmente vos chances d’obtenir des missions sur BricoleUp ?

En 2 minutes, vous pouvez rendre vos services visibles auprès de nouveaux clients.

👉 Publier mon annonce :
https://bricoleup.com/annonces/nouveau/

Ne manquez pas des opportunités !

L’équipe BricoleUp
https://bricoleup.com/

            """

        try:
            send_mail(
                subject,
                body,
                settings.EMAIL_HOST_USER,
                [recipient.email],
                fail_silently=False,
            )
            sent_count += 1
            print(f"Email envoyé à {recipient.email}")
        except Exception as e:
            print(f"Erreur lors de l'envoi à {recipient.email}: {e}")
    print(sent_count) 


















import os
import time
from string import Template

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

# Chemin du template HTML (même dossier que ce fichier views.py)
EMAIL_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "bricoleup_email_profil_incomplet.html")

def build_missing_items_html(missing_fields):
    """Génère les <div> pour chaque élément manquant."""
    items = ""
    for field in missing_fields:
        items += f'''
        <div class="missing-item">
          <span class="bullet"></span>
          <span>{field}</span>
        </div>'''
    return items





# Charger le template HTML une seule fois
    with open(EMAIL_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        raw_template = f.read()

    sent_count = 0

    profiles = (
        Profile.objects
        .filter(type="towork")
        .select_related("user")
        .order_by("-id")
    )

    for profile in profiles:
        missing_picture = not profile.profile_picture
        missing_cover   = not profile.cover_picture
        missing_bio     = not profile.bio or profile.bio.strip() == ""
        missing_skills  = profile.skills.count() == 0
        missing_city    = not profile.city
        missing_zone    = not profile.latitude or not profile.longitude or not profile.radius

        if not any([missing_picture, missing_cover, missing_bio, missing_skills, missing_city, missing_zone]):
            continue

        missing_fields = []
        if missing_picture: missing_fields.append("Photo de profil")
        if missing_cover:   missing_fields.append("Photo de couverture")
        if missing_bio:     missing_fields.append("Présentation / bio")
        if missing_skills:  missing_fields.append("Services proposés")
        if missing_city:    missing_fields.append("Ville")
        if missing_zone:    missing_fields.append("Zone d'intervention")

        recipient = profile.user
        display_name = recipient.get_full_name() or recipient.username

        # Injecter les valeurs dans le HTML
        missing_items_html = build_missing_items_html(missing_fields)
        html_message = (
            raw_template
            .replace("{% for field in missing_fields %}", "")
            .replace("{% endfor %}", "")
            .replace(
                '<div class="missing-item">\n          <span class="bullet"></span>\n          <span>{{ field }}</span>\n        </div>',
                missing_items_html
            )
            .replace("{{ username }}", display_name)
        )

        subject = "Votre profil BricoleUp est incomplet — les clients ne vous voient pas encore"

        text_message = (
            f"Bonjour {display_name},\n\n"
            "Les clients ignorent souvent les profils incomplets, même les meilleurs.\n\n"
            f"Il vous manque : {', '.join(missing_fields)}\n\n"
            "Complétez votre profil en 5 minutes :\n"
            "https://bricoleup.com/profile/edit/\n\n"
            "À très vite,\nL'équipe BricoleUp"
        )

        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.EMAIL_HOST_USER,
                to=[recipient.email],
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)
            sent_count += 1
            print(f"✅ Email envoyé à {recipient.username} <{recipient.email}>")
            time.sleep(2)

        except Exception as e:
            print(f"❌ Erreur lors de l'envoi à {recipient.email}: {e}")

    print(f"\nTotal emails envoyés : {sent_count}")




