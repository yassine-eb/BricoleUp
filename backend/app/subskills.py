bricolage = Skill.objects.get(name_fr="Bricolage")

bricolage_subskills = [
    {"name_fr": "Montage de meubles IKEA", "name_en": "IKEA furniture assembly", "name_ar": "تركيب أثاث ايكيا"},
    {"name_fr": "Assemblage de meubles", "name_en": "Furniture assembly", "name_ar": "تجميع الأثاث"},
    {"name_fr": "Montage de canapé", "name_en": "Sofa assembly", "name_ar": "تركيب الأريكة"},
    {"name_fr": "Montage de lit", "name_en": "Bed assembly", "name_ar": "تركيب السرير"},
    {"name_fr": "Montage de meubles de cuisine", "name_en": "Kitchen furniture assembly", "name_ar": "تركيب أثاث المطبخ"},
    {"name_fr": "Montage de meubles de salle de bain", "name_en": "Bathroom furniture assembly", "name_ar": "تركيب أثاث الحمام"},
    {"name_fr": "Démontage de meubles", "name_en": "Furniture disassembly", "name_ar": "تفكيك الأثاث"},
    {"name_fr": "Réparation de meubles", "name_en": "Furniture repair", "name_ar": "إصلاح الأثاث"},
    {"name_fr": "Peindre un meuble", "name_en": "Paint a piece of furniture", "name_ar": "طلاء قطعة أثاث"},
]

for subskill in bricolage_subskills:
    SubSkill.objects.get_or_create(
        skill=bricolage,
        name_fr=subskill["name_fr"],
        defaults={
            "name_en": subskill["name_en"],
            "name_ar": subskill["name_ar"]
        }
    )
 
bricolage = Skill.objects.get(name_fr="Bricolage")

new_subskills = [
    {"name_fr": "Pose et fixation", "name_en": "Installation and fixing", "name_ar": "التركيب والتثبيت"},
    {"name_fr": "Pose de tringles à rideaux", "name_en": "Curtain rod installation", "name_ar": "تركيب قضبان الستائر"},
    {"name_fr": "Pose de lampes et luminaires", "name_en": "Lamp and light fixture installation", "name_ar": "تركيب المصابيح والإنارة"},
    {"name_fr": "Fixation d'étagères", "name_en": "Shelf mounting", "name_ar": "تثبيت الرفوف"},
    {"name_fr": "Accrocher une TV au mur", "name_en": "Mounting a TV on the wall", "name_ar": "تعليق تلفاز على الحائط"},
    {"name_fr": "Accrocher un tableau", "name_en": "Hanging a picture", "name_ar": "تعليق لوحة"},
    {"name_fr": "Pose de miroir", "name_en": "Mirror installation", "name_ar": "تركيب مرآة"},
    {"name_fr": "Fixer des éléments au mur", "name_en": "Fixing elements to the wall", "name_ar": "تثبيت عناصر على الحائط"},
    {"name_fr": "Pose de barre de douche", "name_en": "Shower bar installation", "name_ar": "تركيب قضيب الدش"},
    {"name_fr": "Pose de paroi de douche", "name_en": "Shower screen installation", "name_ar": "تركيب حاجز الدش"},
    {"name_fr": "Installer un pare-baignoire", "name_en": "Install a bath screen", "name_ar": "تركيب حاجز للبانيو"},
    {"name_fr": "Installation de store intérieur", "name_en": "Indoor blind installation", "name_ar": "تركيب ستائر داخلية"},
    {"name_fr": "Pose de hotte aspirante", "name_en": "Installing a range hood", "name_ar": "تركيب شفاط المطبخ"},
    {"name_fr": "Pose de crédence", "name_en": "Splashback installation", "name_ar": "تركيب الحاجز الخلفي للمطبخ"},
    {"name_fr": "Pose de clôture extérieure", "name_en": "Outdoor fence installation", "name_ar": "تركيب سياج خارجي"},
    {"name_fr": "Remplacer une porte", "name_en": "Replace a door", "name_ar": "استبدال باب"},
    {"name_fr": "Changer une poignée", "name_en": "Change a handle", "name_ar": "تغيير مقبض"},
]

for subskill in new_subskills:
    SubSkill.objects.get_or_create(
        skill=bricolage,
        name_fr=subskill["name_fr"],
        defaults={
            "name_en": subskill["name_en"],
            "name_ar": subskill["name_ar"]
        }
    )

reparation = Skill.objects.get(name_fr="Réparation")

reparation_subskills = [
    {"name_fr": "Petites réparations", "name_en": "Minor repairs", "name_ar": "إصلاحات بسيطة"},
    {"name_fr": "Réparation de meubles", "name_en": "Furniture repair", "name_ar": "إصلاح الأثاث"},
    {"name_fr": "Boucher un trou", "name_en": "Filling a hole", "name_ar": "سد حفرة"},
    {"name_fr": "Réparer un vélo", "name_en": "Bike repair", "name_ar": "إصلاح دراجة"},
    {"name_fr": "Réparer une chasse d'eau", "name_en": "Flush mechanism repair", "name_ar": "إصلاح صندوق الطرد (السيفون)"},
]

for subskill in reparation_subskills:
    SubSkill.objects.get_or_create(
        skill=reparation,
        name_fr=subskill["name_fr"],
        defaults={
            "name_en": subskill["name_en"],
            "name_ar": subskill["name_ar"]
        }
    )



plomberie = Skill.objects.get(name_fr="Plomberie")

plomberie_subskills = [
    {"name_fr": "Réparation de fuites d'eau", "name_en": "Water leak repair", "name_ar": "إصلاح تسرب المياه"},
    {"name_fr": "Changer une chasse d'eau", "name_en": "Replace a flush tank", "name_ar": "تغيير صندوق الطرد"},
    {"name_fr": "Changer un robinet", "name_en": "Replace a faucet", "name_ar": "تغيير صنبور"},
    {"name_fr": "Déboucher un évier", "name_en": "Unclog a sink", "name_ar": "فتح حوض مسدود"},
    {"name_fr": "Déboucher des WC", "name_en": "Unclog a toilet", "name_ar": "فتح مرحاض مسدود"},
    {"name_fr": "Débouchage des canalisations", "name_en": "Pipe unclogging", "name_ar": "فتح المجاري"},
    {"name_fr": "Faire les joints de la salle de bain", "name_en": "Reseal bathroom joints", "name_ar": "عمل السدود في الحمام"},
    {"name_fr": "Réparer une chasse d'eau", "name_en": "Flush tank repair", "name_ar": "إصلاح صندوق الطرد"},
    {"name_fr": "Changer une bonde", "name_en": "Replace a drain plug", "name_ar": "تغيير سدادة الصرف"},
    {"name_fr": "Changer un siphon", "name_en": "Replace a siphon", "name_ar": "تغيير السيفون"},
    {"name_fr": "Détartrer des toilettes", "name_en": "Descale toilet", "name_ar": "إزالة التكلس من المرحاض"},
    {"name_fr": "Changer l'abattant des WC", "name_en": "Replace toilet seat", "name_ar": "تغيير غطاء المرحاض"},
]

for subskill in plomberie_subskills:
    SubSkill.objects.get_or_create(
        skill=plomberie,
        name_fr=subskill["name_fr"],
        defaults={
            "name_en": subskill["name_en"],
            "name_ar": subskill["name_ar"]
        }
    )

