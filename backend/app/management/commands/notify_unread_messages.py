from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings

from app.models import Message


class Command(BaseCommand):
    help = "Send email notifications for unread messages older than 15 minutes"

    def handle(self, *args, **kwargs):
        limit_time = timezone.now() - timedelta(minutes=15)

        messages = Message.objects.filter(
            is_read=False,
            email_sent=False,
            timestamp__lte=limit_time
        )

        for message in messages:
            conversation = message.conversation

            # Receiver = the other user
            receiver = (
                conversation.user2
                if message.sender == conversation.user1
                else conversation.user1
            )

            if not receiver.email:
                continue

            send_mail(
                subject="Vous avez un nouveau message sur BricoleUp",
                message=(
                    f"Bonjour {receiver.username},\n\n"
                    "Vous avez un message non lu depuis plus de 15 minutes.\n\n"
                    "👉 Consultez-le ici : https://bricoleup.com/\n\n"
                    "À très vite,\n"
                    "L’équipe BricoleUp"
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[receiver.email],
                fail_silently=True,
            )

            message.email_sent = True
            message.save(update_fields=["email_sent"])

        self.stdout.write(
            self.style.SUCCESS(f"{messages.count()} notifications envoyées")
        )
