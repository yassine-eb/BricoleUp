
    
profiles_data = [

        # ============================
        # 1️⃣ Ménage & Aide à domicile
        # ============================
        {
            "username": "salma ma",
            "email": "salma@example.com",
            "prenom": "Salma",
            "nom": "El Amrani",
            "sexe": "female",
            "title": "Aide ménagère",
            "bio": "Professionnelle sérieuse en ménage, repassage et aide à domicile, avec 5 ans d’expérience.",
            "statut": "particulier",
            "category": "Ménage & Aide à domicile",
            "city": "Casablanca",
        },
        {
            "username": "nadia clean",
            "email": "nadia@example.com",
            "prenom": "Nadia",
            "nom": "Hassani",
            "sexe": "female",
            "title": "Aide à domicile & garde d’enfants",
            "bio": "Fiable et ponctuelle, spécialisée dans l’aide aux familles et la garde d’enfants.",
            "statut": "particulier",
            "category": "Ménage & Aide à domicile",
            "city": "Rabat",
        },
        {
            "username": "fatima service",
            "email": "fatima@example.com",
            "prenom": "Fatima",
            "nom": "Ouazzani",
            "sexe": "female",
            "title": "Ménage & entretien",
            "bio": "Experte en entretien ménager profond et nettoyage professionnel d’appartements.",
            "statut": "particulier",
            "category": "Ménage & Aide à domicile",
            "city": "Marrakech",
        },

        # =======================================
        # 2️⃣ Bricolage Général & Gros Œuvre
        # =======================================
        {
            "username": "amine bricolage",
            "email": "amine@example.com",
            "prenom": "Amine",
            "nom": "Bennani",
            "sexe": "male",
            "title": "Bricoleur polyvalent",
            "bio": "Montage de meubles, peinture, petites réparations. 10 ans d’expérience.",
            "statut": "entreprise",
            "category": "Bricolage Général & Gros Œuvre",
            "city": "Casablanca",
        },
        {
            "username": "youssef pro",
            "email": "youssef@example.com",
            "prenom": "Youssef",
            "nom": "El Idrissi",
            "sexe": "male",
            "title": "Maçon & rénovateur",
            "bio": "Spécialiste en gros œuvre, carrelage et rénovation intérieure.",
            "statut": "entreprise",
            "category": "Bricolage Général & Gros Œuvre",
            "city": "Fès",
        },
        {
            "username": "rachid travaux",
            "email": "rachid@example.com",
            "prenom": "Rachid",
            "nom": "Kabbaj",
            "sexe": "male",
            "title": "Bricoleur & réparateur",
            "bio": "Intervention rapide pour réparations domestiques et petits travaux.",
            "statut": "particulier",
            "category": "Bricolage Général & Gros Œuvre",
            "city": "Tanger",
        },

        # ====================================
        # 3️⃣ Jardinage, Piscines & Extérieur
        # ====================================
        {
            "username": "khadija jardin",
            "email": "khadija@example.com",
            "prenom": "Khadija",
            "nom": "Alaoui",
            "sexe": "female",
            "title": "Jardinière",
            "bio": "Entretien de jardins, taille, arrosage, décoration extérieure.",
            "statut": "particulier",
            "category": "Jardinage, Piscines & Extérieur",
            "city": "Marrakech",
        },
        {
            "username": "mustapha green",
            "email": "mustapha@example.com",
            "prenom": "Mustapha",
            "nom": "Fadili",
            "sexe": "male",
            "title": "Entretien piscines & extérieurs",
            "bio": "Entretien piscines, nettoyage, filtration, réparations légères.",
            "statut": "entreprise",
            "category": "Jardinage, Piscines & Extérieur",
            "city": "Agadir",
        },
        {
            "username": "sami garden",
            "email": "sami@example.com",
            "prenom": "Sami",
            "nom": "Mezouari",
            "sexe": "male",
            "title": "Jardinier paysagiste",
            "bio": "Aménagement de jardins, plantations, systèmes d’irrigation.",
            "statut": "entreprise",
            "category": "Jardinage, Piscines & Extérieur",
            "city": "Rabat",
        },

        # ==============================
        # 4️⃣ Plomberie & Électricité
        # ==============================
        {
            "username": "omar plombier",
            "email": "omar@example.com",
            "prenom": "Omar",
            "nom": "Tahiri",
            "sexe": "male",
            "title": "Plombier certifié",
            "bio": "Dépannage urgent, installation sanitaire, réparation fuites.",
            "statut": "entreprise",
            "category": "Plomberie & Electricité",
            "city": "Casablanca",
        },
        {
            "username": "hana electro",
            "email": "hana@example.com",
            "prenom": "Hana",
            "nom": "Zerhouni",
            "sexe": "female",
            "title": "Électricienne",
            "bio": "Installation, réparation, mise en conformité électrique.",
            "statut": "particulier",
            "category": "Plomberie & Electricité",
            "city": "Rabat",
        },
        {
            "username": "adil tech",
            "email": "adil@example.com",
            "prenom": "Adil",
            "nom": "Ghazi",
            "sexe": "male",
            "title": "Plombier & électricien",
            "bio": "Double compétence : plomberie + électricité pour interventions rapides.",
            "statut": "entreprise",
            "category": "Plomberie & Electricité",
            "city": "Meknès",
        },

    ]


    ma_country = Country.objects.filter(code="MA").first()

    for data in profiles_data:

        user, created = User.objects.get_or_create(
            username=data["username"],
            defaults={"email": data["email"]}
        )

        if created:
            user.set_password("bm2025")
            user.save()

        city_obj = City.objects.filter(name_fr__icontains=data["city"]).first()

        Profile.objects.get_or_create(
            user=user,
            defaults={
                "prenom": data["prenom"],
                "nom": data["nom"],
                "gender": data["sexe"],
                "type": "tohire",
                "statut": data["statut"],
                "title": data["title"],
                "bio": data["bio"],
                "country": ma_country,
                "city": city_obj,
                "add_to_search": True,
                "is_useractif": True,
            }
        )


profiles_data = [
        {"username": "Clara Martin", "email": "clara.martin@gmail.com", "comment": "Travail impeccable, la maison est toujours propre et rangée.", "sexe": "femme"},
        {"username": "Emma Bernard", "email": "emma.bernard@gmail.com", "comment": "Toujours à l’écoute et très professionnelle dans le ménage.", "sexe": "femme"},
        {"username": "Sophie Roux", "email": "sophie.roux@gmail.com", "comment": "Résultat parfait, aucun coin n’est oublié.", "sexe": "femme"},
        {"username": "Léa Caron", "email": "lea.caron@gmail.com", "comment": "Très satisfaite, maison impeccablement entretenue.", "sexe": "femme"},
        {"username": "Camille Dubois", "email": "camille.dubois@gmail.com", "comment": "Service rapide et efficace, je recommande vivement.", "sexe": "femme"},
        {"username": "Manon Richard", "email": "manon.richard@gmail.com", "comment": "Travail soigné et fiable, toujours ponctuelle.", "sexe": "femme"},
        {"username": "Élodie Laurent", "email": "elodie.laurent@gmail.com", "comment": "Service impeccable, maison parfaitement entretenue.", "sexe": "femme"},
    ]



    # Fonction utilitaire pour générer une date aléatoire entre deux bornes
    def random_date(start, end):
        delta = end - start
        random_days = random.randrange(delta.days)
        return start + timedelta(days=random_days)

    # Dates bornes
    start_date = timezone.make_aware(datetime(2025, 1, 1))
    end_date = timezone.make_aware(datetime(2025, 11, 10))

    # Profil cible
    reviewed_profile = get_object_or_404(Profile, slug=slug)

    for data in profiles_data:
        # Créer un utilisateur s’il n’existe pas déjà
        user, created = User.objects.get_or_create(
            username=data["username"],
            defaults={"email": data["email"]}
        )
        if created:
            user.set_password("bf2025")
            user.save()

        # Créer un profil lié à cet utilisateur
        profile, _ = Profile.objects.get_or_create(user=user, defaults={
            "gender": data["sexe"],
            "type": "tohire",
            "statut": "particulier",

        })

        # Déterminer une note cohérente avec le commentaire
        comment = data["comment"].lower()
        if "parfait" in comment or "excellent" in comment or "au-delà" in comment or "recommande" in comment:
            rating = 5.0
        elif "très" in comment or "satisfaite" in comment or "bon" in comment:
            rating = 4.0
        elif "retard" in comment or "pourrait être plus rapide" in comment:
            rating = 3.0
        else:
            rating = random.choice([4.0, 5.0])

        # Créer une date aléatoire entre janvier et novembre 2025
        date = random_date(start_date, end_date)

        # Créer la review
        Review.objects.get_or_create(
            reviewer=user,
            reviewed=reviewed_profile,
            defaults={
                "rating": rating,
                "comment": data["comment"],
                "timestamp": date
            }
        )

    print("✅ Reviews et profils créés avec succès.")
