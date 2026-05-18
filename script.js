// ========== VARIABLES GLOBALES ==========
let taches = JSON.parse(localStorage.getItem('gmao_taches') || '[]');
let releves = JSON.parse(localStorage.getItem('gmao_releves') || '[]');
let alertes = JSON.parse(localStorage.getItem('gmao_alertes') || '[]');
let maintenancesPlanifiees = JSON.parse(localStorage.getItem('gmao_planifiees') || '[]');
let interventions = JSON.parse(localStorage.getItem('gmao_interventions') || '[]');
let moisActuel = new Date().getMonth();
let anneeActuelle = new Date().getFullYear();
let chartTemp = null;
let chartTempTech = null;
// ========== STOCKAGE CLOUD SUPABASE ==========
async function chargerDonneesCloud() {
    if (typeof window.supabaseClient === 'undefined') {
        console.log("Supabase non disponible");
        return;
    }
    try {
        const { data, error } = await window.supabaseClient
            .from('donnees')
            .select('*');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            for (let item of data) {
                if (item.cle === 'taches') taches = item.valeur;
                if (item.cle === 'releves') releves = item.valeur;
                if (item.cle === 'alertes') alertes = item.valeur;
                if (item.cle === 'maintenancesPlanifiees') maintenancesPlanifiees = item.valeur;
                if (item.cle === 'interventions') interventions = item.valeur;
                if (item.cle === 'calendriers') {
                    for (let key in item.valeur) {
                        localStorage.setItem(key, JSON.stringify(item.valeur[key]));
                    }
                }
            }
            rafraichir();
            if (typeof initialiserGraphique === 'function') initialiserGraphique();
            console.log("✅ Données chargées depuis Supabase");
        }
    } catch (err) {
        console.log("Erreur chargement Supabase:", err);
    }
}

async function sauvegarderDonneesCloud() {
    if (typeof window.supabaseClient === 'undefined') return;
    
    let calendriers = {};
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith('calendrier_')) {
            calendriers[key] = JSON.parse(localStorage.getItem(key));
        }
    }
    
    const toutesDonnees = [
        { cle: 'taches', valeur: taches },
        { cle: 'releves', valeur: releves },
        { cle: 'alertes', valeur: alertes },
        { cle: 'maintenancesPlanifiees', valeur: maintenancesPlanifiees },
        { cle: 'interventions', valeur: interventions },
        { cle: 'calendriers', valeur: calendriers }
    ];
    
    try {
        for (let item of toutesDonnees) {
            const { error } = await window.supabaseClient
                .from('donnees')
                .upsert({ cle: item.cle, valeur: item.valeur }, { onConflict: 'cle' });
            if (error) throw error;
        }
        console.log("✅ Données sauvegardées dans Supabase");
    } catch (err) {
        console.log("Erreur sauvegarde Supabase:", err);
    }
}
async function sauvegarderDonneesCloud() {
    if (typeof supabase === 'undefined') return;
    
    let calendriers = {};
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith('calendrier_')) {
            calendriers[key] = JSON.parse(localStorage.getItem(key));
        }
    }
    
    const toutesDonnees = [
        { cle: 'taches', valeur: taches },
        { cle: 'releves', valeur: releves },
        { cle: 'alertes', valeur: alertes },
        { cle: 'maintenancesPlanifiees', valeur: maintenancesPlanifiees },
        { cle: 'interventions', valeur: interventions },
        { cle: 'calendriers', valeur: calendriers }
    ];
    
    try {
        for (let item of toutesDonnees) {
            const { error } = await supabase
                .from('donnees')
                .upsert({ cle: item.cle, valeur: item.valeur }, { onConflict: 'cle' });
            if (error) throw error;
        }
        console.log("✅ Données sauvegardées dans Supabase");
    } catch (err) {
        console.log("Erreur sauvegarde Supabase:", err);
    }
}

// Modifier la fonction sauvegarder() existante
// Ajoutez cette ligne à la fin de votre fonction sauvegarder() :
// sauvegarderDonneesCloud();

// Appeler au chargement
chargerDonneesCloud();
function mettreAJourStatsAccueil() {
    console.log('Mise à jour des statistiques...');
    
    // 1. Dernière température (depuis releves)
    if (releves.length > 0) {
        let dernier = releves[releves.length - 1];
        let derniereTemp = document.getElementById('derniereTemp');
        if (derniereTemp) derniereTemp.innerHTML = dernier.temperature + ' °C';
    } else {
        let derniereTemp = document.getElementById('derniereTemp');
        if (derniereTemp) derniereTemp.innerHTML = '-- °C';
    }
    
    // 2. État solaire
    let etatSolaire = document.getElementById('etatSolaireActuel');
    if (etatSolaire) etatSolaire.innerHTML = '🟢 Vert (Normal)';
    
    // 3. Dernière maintenance
    if (interventions.length > 0) {
        let derniere = interventions[interventions.length - 1];
        let derniereMaintenance = document.getElementById('derniereMaintenance');
        if (derniereMaintenance) derniereMaintenance.innerHTML = derniere.date.split(',')[0];
    }
    
    // 4. Prochaine maintenance
    let tachesNonFaites = taches.filter(t => !t.fini);
    if (tachesNonFaites.length > 0) {
        let prochaine = tachesNonFaites[0];
        let prochaineMaintenance = document.getElementById('prochaineMaintenance');
        if (prochaineMaintenance) prochaineMaintenance.innerHTML = prochaine.date.split(',')[0];
    } else {
        let prochaineMaintenance = document.getElementById('prochaineMaintenance');
        if (prochaineMaintenance) prochaineMaintenance.innerHTML = '--';
    }
}
// ========== GESTION DU NOM PRESPONSABLE ==========
function getNomResponsable() {
    let nom = localStorage.getItem('nom_responsable');
    if (!nom) {
        nom = prompt("📝 Veuillez entrer votre nom (responsable morgue) :", "Agent morgue");
        if (nom && nom.trim() !== '') {
            localStorage.setItem('nom_responsable', nom.trim());
            return nom.trim();
        }
        return "Agent morgue";
    }
    return nom;
}

function modifierNomResponsable() {
    let nouveauNom = prompt("📝 Modifier votre nom :", localStorage.getItem('nom_responsable') || "Agent morgue");
    if (nouveauNom && nouveauNom.trim() !== '') {
        localStorage.setItem('nom_responsable', nouveauNom.trim());
        alert('✅ Nom mis à jour : ' + nouveauNom);
        rafraichir();
    }
}
// ========== UTILISATEURS ==========
const UTILISATEURS = {
    responsable: { email: "responsable@hopital.com", password: "responsable123", role: "responsable" },
    technicien: { email: "technicien@hopital.com", password: "technicien123", role: "technicien" }
};

// ========== FONCTIONS D'AFFICHAGE ==========
function afficherPageConnexion() {
    document.getElementById('pageAccueil').style.display = 'none';
    document.getElementById('pageConnexion').style.display = 'block';
}

function afficherPageConnexionTechnicien() {
    document.getElementById('pageAccueil').style.display = 'none';
    document.getElementById('pageConnexionTechnicien').style.display = 'block';
}

function connexion() {
    let email = document.getElementById('loginEmail').value;
    let pwd = document.getElementById('loginPassword').value;
    let errorDiv = document.getElementById('loginError');
    
    if (email === UTILISATEURS.responsable.email && pwd === UTILISATEURS.responsable.password) {
        localStorage.setItem('gmao_role', 'responsable');
        document.getElementById('pageConnexion').style.display = 'none';
        document.getElementById('pageResponsable').style.display = 'block';
        chargerDonnees();
        afficherCalendrier();
        rafraichir();
        initialiserGraphique();
    }
    else {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = '❌ Email ou mot de passe incorrect';
        setTimeout(() => { errorDiv.style.display = 'none'; }, 3000);
    }
}

function connexionTechnicien() {
    let email = document.getElementById('loginEmailTech').value;
    let pwd = document.getElementById('loginPasswordTech').value;
    let errorDiv = document.getElementById('loginErrorTech');
    
    if (email === UTILISATEURS.technicien.email && pwd === UTILISATEURS.technicien.password) {
        localStorage.setItem('gmao_role', 'technicien');
        document.getElementById('pageConnexionTechnicien').style.display = 'none';
        document.getElementById('pageTechnicien').style.display = 'block';
        chargerDonnees();
        afficherCalendrierTechnicien();
        afficherPageTechnicien();
        initialiserGraphiqueTechnicien();
    }
    else {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = '❌ Email ou mot de passe incorrect';
        setTimeout(() => { errorDiv.style.display = 'none'; }, 3000);
    }
}

function deconnexion() {
    localStorage.removeItem('gmao_role');
    document.getElementById('pageResponsable').style.display = 'none';
    document.getElementById('pageTechnicien').style.display = 'none';
    document.getElementById('pageConnexion').style.display = 'none';
    document.getElementById('pageConnexionTechnicien').style.display = 'none';
    document.getElementById('pageAccueil').style.display = 'block';
    if (chartTemp) chartTemp.destroy();
    if (chartTempTech) chartTempTech.destroy();
}

function chargerDonnees() {
    taches = JSON.parse(localStorage.getItem('gmao_taches') || '[]');
    releves = JSON.parse(localStorage.getItem('gmao_releves') || '[]');
    alertes = JSON.parse(localStorage.getItem('gmao_alertes') || '[]');
    maintenancesPlanifiees = JSON.parse(localStorage.getItem('gmao_planifiees') || '[]');
    interventions = JSON.parse(localStorage.getItem('gmao_interventions') || '[]');
    mettreAJourStatsAccueil();  // ← AJOUTER CETTE LIGNE
}

function sauvegarder() {
    localStorage.setItem('gmao_taches', JSON.stringify(taches));
    localStorage.setItem('gmao_releves', JSON.stringify(releves));
    localStorage.setItem('gmao_alertes', JSON.stringify(alertes));
    localStorage.setItem('gmao_planifiees', JSON.stringify(maintenancesPlanifiees));
    localStorage.setItem('gmao_interventions', JSON.stringify(interventions));
    sauvegarderDonneesCloud()
}

// ========== CALENDRIER PAR MOIS ==========
function getJoursDansMois(annee, mois) {
    return new Date(annee, mois + 1, 0).getDate();
}

function afficherCalendrier() {
    let moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let moisAffichage = document.getElementById('moisActuel');
    if (moisAffichage) {
        moisAffichage.innerText = moisNoms[moisActuel] + ' ' + anneeActuelle;
    }

    let nbJours = getJoursDansMois(anneeActuelle, moisActuel);
    let storageKey = 'calendrier_' + anneeActuelle + '_' + moisActuel;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (data.length === 0) {
        data = [];
        for (let jour = 1; jour <= nbJours; jour++) {
            let dateStr = jour.toString().padStart(2, '0') + '/' + (moisActuel+1).toString().padStart(2, '0') + '/' + anneeActuelle;
            for (let heure of ['Matin', 'Soir']) {
                data.push({
                    id: Date.now() + jour + (heure === 'Matin' ? 0 : 1000),
                    date: dateStr,
                    heure: heure,
                    temperature: '',
                    pression: '',
                    intensite: '',
                    consommation: '',
                    etatCompresseur: 'Normal',
                    tensionBatterie: '',
                    productionSolaire: '',
                    pressionHuile: '',
                    tempExterieure: '',
                    observations: '',
                    actions: '',
                    photo: ''
                });
            }
        }
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    let tbody = document.getElementById('calendrierBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    for (let i = 0; i < data.length; i++) {
        let ligne = data[i];
        let row = tbody.insertRow();
        row.innerHTML = `
            <td>${ligne.date}</td>
            <td>${ligne.heure}</td>
            <td><input type="number" step="0.1" class="temp-input" data-id="${ligne.id}" value="${ligne.temperature || ''}" placeholder="°C" style="width:70px;"></td>
            <td><input type="number" step="0.1" class="pression-input" data-id="${ligne.id}" value="${ligne.pression || ''}" placeholder="bar" style="width:70px;"></td>
            <td><input type="number" step="0.1" class="intensite-input" data-id="${ligne.id}" value="${ligne.intensite || ''}" placeholder="A" style="width:70px;"></td>
            <td><input type="number" step="0.1" class="conso-input" data-id="${ligne.id}" value="${ligne.consommation || ''}" placeholder="kW" style="width:70px;"></td>
            <td><select class="etat-input" data-id="${ligne.id}" style="width:100px;"><option ${ligne.etatCompresseur === 'Normal' ? 'selected' : ''}>Normal</option><option ${ligne.etatCompresseur === 'Anormal' ? 'selected' : ''}>Anormal</option><option ${ligne.etatCompresseur === 'Panne' ? 'selected' : ''}>Panne</option></select></td>
            <td><input type="number" step="0.1" class="tension-input" data-id="${ligne.id}" value="${ligne.tensionBatterie || ''}" placeholder="V" style="width:70px;"></td>
            <td><input type="number" step="0.1" class="prod-input" data-id="${ligne.id}" value="${ligne.productionSolaire || ''}" placeholder="kWh" style="width:70px;"></td>
            <td><input type="number" step="0.1" class="huile-input" data-id="${ligne.id}" value="${ligne.pressionHuile || ''}" placeholder="bar" style="width:70px;"></td>
            <td><input type="number" step="0.1" class="texter-input" data-id="${ligne.id}" value="${ligne.tempExterieure || ''}" placeholder="°C" style="width:70px;"></td>
            <td><input type="text" class="obs-input" data-id="${ligne.id}" value="${ligne.observations || ''}" placeholder="..." style="width:120px;"></td>
            <td><input type="text" class="action-input" data-id="${ligne.id}" value="${ligne.actions || ''}" placeholder="..." style="width:120px;"></td>
            <td><input type="file" class="photo-input" data-id="${ligne.id}" accept="image/*" style="width:80px;"><br>${ligne.photo ? '<img src="'+ligne.photo+'" width="30">' : ''}</td>
        `;
    }
    ajouterEcouteursCalendrier();
}

function ajouterEcouteursCalendrier() {
    document.querySelectorAll('.temp-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'temperature', e.target.value)));
    document.querySelectorAll('.pression-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'pression', e.target.value)));
    document.querySelectorAll('.intensite-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'intensite', e.target.value)));
    document.querySelectorAll('.conso-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'consommation', e.target.value)));
    document.querySelectorAll('.etat-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'etatCompresseur', e.target.value)));
    document.querySelectorAll('.tension-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'tensionBatterie', e.target.value)));
    document.querySelectorAll('.prod-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'productionSolaire', e.target.value)));
    document.querySelectorAll('.huile-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'pressionHuile', e.target.value)));
    document.querySelectorAll('.texter-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'tempExterieure', e.target.value)));
    document.querySelectorAll('.obs-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'observations', e.target.value)));
    document.querySelectorAll('.action-input').forEach(el => el.addEventListener('change', (e) => modifierChampCalendrier(e.target.dataset.id, 'actions', e.target.value)));
    document.querySelectorAll('.photo-input').forEach(el => el.addEventListener('change', (e) => {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(ev) { modifierChampCalendrier(e.target.dataset.id, 'photo', ev.target.result); };
            reader.readAsDataURL(file);
        }
    }));
}
function modifierChampCalendrier(id, champ, valeur) {
            let storageKey = 'calendrier_' + anneeActuelle + '_' + moisActuel;
            let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
            let index = data.findIndex(d => d.id == id);
            
            if (index !== -1) {
                data[index][champ] = valeur;
                localStorage.setItem(storageKey, JSON.stringify(data));
                mettreAJourGraphique();
                verifierAlerteTemperature(data[index].temperature, data[index].date, data[index].heure);
                
                // ========== AJOUT AUTOMATIQUE À L'HISTORIQUE ==========
                if (champ === 'temperature' && data[index].temperature && data[index].temperature !== '') {
                    // Récupérer le nom du responsable (demande une seule fois)
                    let nomResponsable = getNomResponsable();
                    let etatComp = data[index].etatCompresseur || 'Normal';
                    
                    // Vérifier si ce relevé existe déjà dans l'historique
                    let existeDeja = releves.some(r => r.date === data[index].date + ' (' + data[index].heure + ')');
                    
                    if (!existeDeja) {
                        releves.push({
                            date: data[index].date + ' (' + data[index].heure + ')',
                            temperature: parseFloat(data[index].temperature),
                            nom: nomResponsable,
                            solaire: etatComp
                        });
                        sauvegarder();
                        rafraichir();
                        console.log('✅ Relevé ajouté à l\'historique:', data[index].date, data[index].heure, data[index].temperature);
                    }
                }
                // ========== FIN AJOUT ==========
            }
        }

function sauvegarderCalendrier() {
    // Récupérer toutes les valeurs modifiées via les événements 'change'
    let moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    alert('✅ Calendrier de ' + moisNoms[moisActuel] + ' ' + anneeActuelle + ' sauvegardé');
    initialiserGraphique();
}

function changerMois(delta) {
    let nouveauMois = moisActuel + delta;
    let anneeModifiee = anneeActuelle;

    if (nouveauMois < 0) {
        nouveauMois = 11;
        anneeModifiee--;
    } else if (nouveauMois > 11) {
        nouveauMois = 0;
        anneeModifiee++;
    }

    moisActuel = nouveauMois;
    anneeActuelle = anneeModifiee;

    // Mettre à jour l'affichage du mois
    let moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let moisAffichage = document.getElementById('moisActuel');
    if (moisAffichage) {
        moisAffichage.innerText = moisNoms[moisActuel] + ' ' + anneeActuelle;
    }

    // Recharger le calendrier
    afficherCalendrier();
    
    // Recharger le graphique
    initialiserGraphique();
    if (chartTempTech) initialiserGraphiqueTechnicien();
    
    // Mettre à jour les statistiques de la page d'accueil
    mettreAJourStatsAccueil();
}
function afficherCalendrierTechnicien() {
    let storageKey = 'calendrier_' + anneeActuelle + '_' + moisActuel;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let tbody = document.getElementById('calendrierTechBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        let ligne = data[i];
        let row = tbody.insertRow();
        row.innerHTML = `
            <td>${ligne.date}</td>
            <td>${ligne.heure}</td>
            <td>${ligne.temperature || '-'}°C</td>
            <td>${ligne.etatCompresseur || '-'}</td>
            <td>${ligne.observations || '-'}</td>
        `;
    }
}

function verifierAlerteTemperature(temp, date, heure) {
    let t = parseFloat(temp);
    if (!isNaN(t) && t > 5) {
        let notif = document.getElementById('notificationZone');
        if (notif) {
            notif.style.display = 'block';
            notif.innerHTML = '⚠️ ALERTE : Température ' + t + '°C à ' + date + ' (' + heure + ') - Seuil normal: 0-5°C';
            setTimeout(() => notif.style.display = 'none', 5000);
        }
        if (t > 7) {
            genererMaintenance('URGENT', 'COMPRESSEUR', 'Température critique ' + t + '°C');
        } else if (t > 5) {
            genererMaintenance('PREVENTIF', 'ÉVAPORATEUR', 'Température anormale ' + t + '°C');
        }
    }
}

function genererMaintenance(type, composant, cause) {
    let newId = Date.now();
    taches.push({ id: newId, date: new Date().toLocaleString(), type: type, composant: composant, action: type === 'URGENT' ? 'Intervention immédiate' : 'Maintenance préventive', cause: cause, fini: false });
    sauvegarder();
    rafraichir();
}

function initialiserGraphique() {
    let ctx = document.getElementById('graphiqueTemp');
    if (!ctx) return;
    ctx = ctx.getContext('2d');
    let storageKey = 'calendrier_' + anneeActuelle + '_' + moisActuel;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let jours = [];
    let tempsMatin = [];
    let tempsSoir = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].heure === 'Matin') {
            jours.push(data[i].date);
            tempsMatin.push(data[i].temperature ? parseFloat(data[i].temperature) : null);
            if (i + 1 < data.length && data[i+1].heure === 'Soir') {
                tempsSoir.push(data[i+1].temperature ? parseFloat(data[i+1].temperature) : null);
            } else {
                tempsSoir.push(null);
            }
        }
    }
    if (chartTemp) chartTemp.destroy();
    chartTemp = new Chart(ctx, {
        type: 'line',
        data: {
            labels: jours,
            datasets: [
                { label: 'Matin', data: tempsMatin, borderColor: '#2e7d32', backgroundColor: 'transparent', tension: 0.3 },
                { label: 'Soir', data: tempsSoir, borderColor: '#795548', backgroundColor: 'transparent', tension: 0.3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { min: -5, max: 15, title: { display: true, text: 'Température (°C)' } } }
        }
    });
}

function mettreAJourGraphique() {
    if (chartTemp) initialiserGraphique();
    if (chartTempTech) initialiserGraphiqueTechnicien();
}

function initialiserGraphiqueTechnicien() {
    let ctx = document.getElementById('graphiqueTempTech');
    if (!ctx) return;
    ctx = ctx.getContext('2d');
    let storageKey = 'calendrier_' + anneeActuelle + '_' + moisActuel;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let jours = [];
    let tempsMatin = [];
    let tempsSoir = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].heure === 'Matin') {
            jours.push(data[i].date);
            tempsMatin.push(data[i].temperature ? parseFloat(data[i].temperature) : null);
            if (i + 1 < data.length && data[i+1].heure === 'Soir') {
                tempsSoir.push(data[i+1].temperature ? parseFloat(data[i+1].temperature) : null);
            } else {
                tempsSoir.push(null);
            }
        }
    }
    if (chartTempTech) chartTempTech.destroy();
    chartTempTech = new Chart(ctx, {
        type: 'line',
        data: {
            labels: jours,
            datasets: [
                { label: 'Matin', data: tempsMatin, borderColor: '#7b1fa2', backgroundColor: 'transparent', tension: 0.3 },
                { label: 'Soir', data: tempsSoir, borderColor: '#4a148c', backgroundColor: 'transparent', tension: 0.3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { min: -5, max: 15 } }
        }
    });
}

async function signalerProbleme() {
    let nom = document.getElementById('signalNom').value;
    let tel = document.getElementById('signalTel').value;
    let composant = document.getElementById('composantProbleme').value;
    let description = document.getElementById('descriptionProbleme').value;
    let bruit = document.getElementById('bruitEntendu').value;
    let urgence = document.getElementById('niveauUrgence').value;
    
    if (!nom || !tel) {
        document.getElementById('messageAlerte').innerHTML = '<div class="alert-red">❌ Veuillez entrer votre nom et téléphone</div>';
        return;
    }
    if (!description) {
        document.getElementById('messageAlerte').innerHTML = '<div class="alert-red">❌ Veuillez décrire le problème</div>';
        return;
    }
    
    let date = new Date().toLocaleString();
    let newId = Date.now();
    alertes.push({ id: newId, date: date, nom: nom, tel: tel, composant: composant, description: description, bruit: bruit, urgence: urgence, traite: false });
    let priorite = (urgence === 'Critique' || urgence === 'Élevée') ? 'URGENT' : 'PREVENTIF';
    taches.push({ id: newId, date: date, type: priorite, composant: composant, action: '🚨 ALERTE: Problème sur ' + composant, cause: description.substring(0,100), fini: false });
    sauvegarder();
    rafraichir();
    let sujet = encodeURIComponent('🚨 ALERTE - Chambre froide - ' + composant);
    let corps = encodeURIComponent('🚨 ALERTE CHAMBRE FROIDE MORTUAIRE\n\n📅 Date : ' + date + '\n👤 Signalé par : ' + nom + '\n📞 Téléphone : ' + tel + '\n\n🔧 COMPOSANT : ' + composant + '\n📝 PROBLÈME : ' + description + '\n🔊 BRUIT : ' + bruit + '\n⚡ URGENCE : ' + urgence + '\n\n📍 Hôpital Sakété-Ifangni, Bénin\n\n🔗 Site : ' + window.location.href);
    window.location.href = 'mailto:hzsakete@gmail.com?subject=' + sujet + '&body=' + corps;
    document.getElementById('descriptionProbleme').value = '';
    document.getElementById('messageAlerte').innerHTML = '<div class="alert-green">✅ Alerte enregistrée. Votre email va s\'ouvrir, cliquez sur Envoyer.</div>';
    setTimeout(() => document.getElementById('messageAlerte').innerHTML = '', 5000);
}

function ajouterMaintenancePlanifiee() {
    let date = document.getElementById('planifDate').value;
    let composant = document.getElementById('planifComposant').value;
    let action = document.getElementById('planifAction').value;
    let technicien = document.getElementById('planifTechnicien').value;
    if (!date || !action) { alert('Veuillez remplir la date et l\'action'); return; }
    maintenancesPlanifiees.push({ id: Date.now(), date: date, composant: composant, action: action, technicien: technicien || 'Non assigné', statut: 'planifiee' });
    sauvegarder();
    alert('✅ Maintenance planifiée');
    document.getElementById('planifDate').value = '';
    document.getElementById('planifAction').value = '';
    document.getElementById('planifTechnicien').value = '';
}

function afficherMaintenancesPlanifiees() {
    let container = document.getElementById('planifList');
    if (!container) return;
    if (maintenancesPlanifiees.length === 0) { container.innerHTML = '<p>Aucune maintenance planifiée</p>'; return; }
    let html = '';
    for (let i = maintenancesPlanifiees.length - 1; i >= 0; i--) {
        let m = maintenancesPlanifiees[i];
        html += '<div class="tache-preventif"><strong>📅 ' + m.date + '</strong><br>🔧 ' + m.composant + '<br>📋 ' + m.action + '<br>👤 ' + m.technicien + '<button class="btn-small" onclick="terminerPlanifiee(' + m.id + ')">✓ Terminer</button></div>';
    }
    container.innerHTML = html;
}

function terminerPlanifiee(id) {
    let index = maintenancesPlanifiees.findIndex(m => m.id === id);
    if (index !== -1) {
        interventions.push({ id: Date.now(), date: new Date().toLocaleString(), composant: maintenancesPlanifiees[index].composant, action: maintenancesPlanifiees[index].action, type: 'Planifiée' });
        maintenancesPlanifiees.splice(index, 1);
        sauvegarder();
        afficherMaintenancesPlanifiees();
        afficherInterventions();
    }
}

function afficherStats() {
    let urgentes = taches.filter(t => t.type === 'URGENT' && !t.fini).length;
    let preventives = taches.filter(t => t.type === 'PREVENTIF' && !t.fini).length;
    document.getElementById('statUrgent').innerText = urgentes;
    document.getElementById('statPreventif').innerText = preventives;
    document.getElementById('statTotal').innerText = taches.length;
    document.getElementById('statReleves').innerText = releves.length;
}

function afficherTaches() {
    let liste = taches.filter(t => !t.fini);
    if (liste.length === 0) { document.getElementById('tachesList').innerHTML = '<p>✅ Aucune maintenance en attente</p>'; return; }
    let html = '';
    for (let i = liste.length - 1; i >= 0; i--) {
        let t = liste[i];
        let classe = t.type === 'URGENT' ? 'tache-urgent' : 'tache-preventif';
        html += '<div class="' + classe + '"><strong>📅 ' + t.date + '</strong><br>🔧 ' + t.composant + '<br>📋 ' + t.action + '<br>🔍 ' + t.cause + '<br><button class="btn-small" onclick="terminerTache(' + t.id + ')">✓ Terminer</button></div>';
    }
    document.getElementById('tachesList').innerHTML = html;
}

function afficherHistorique() {
    if (releves.length === 0) { document.getElementById('historiqueList').innerHTML = '<p>Aucun relevé</p>'; return; }
    let html = '';
    for (let i = releves.length - 1; i >= 0; i--) {
        let r = releves[i];
        let couleur = r.temperature > 7 ? '#c62828' : (r.temperature > 5 ? '#ff9800' : '#2e7d32');
        html += '<div style="padding:10px; border-bottom:1px solid #ddd;"><strong>📅 ' + r.date + '</strong><br>🌡️ <span style="color:' + couleur + '">' + r.temperature + '°C</span><br>👤 ' + r.nom + '<br>☀️ ' + r.solaire + '</div>';
    }
    document.getElementById('historiqueList').innerHTML = html;
}

function terminerTache(id) {
    let t = taches.find(t => t.id === id);
    if (t) { t.fini = true; interventions.push({ id: Date.now(), date: new Date().toLocaleString(), composant: t.composant, action: t.action, type: 'Tâche' }); sauvegarder(); rafraichir(); afficherInterventions(); }
}

function toutTerminer() {
    if (confirm('Terminer toutes les maintenances ?')) {
        taches.forEach(t => { if (!t.fini) { t.fini = true; interventions.push({ id: Date.now(), date: new Date().toLocaleString(), composant: t.composant, action: t.action, type: 'Tâche' }); } });
        sauvegarder(); rafraichir(); afficherInterventions();
    }
}

function exporterCSV() {
    let storageKey = 'calendrier_' + anneeActuelle + '_' + moisActuel;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let csv = "Date;Heure;Température;Pression;Intensité;Consommation;État compresseur;Tension batterie;Production solaire;Pression huile;Temp extérieure;Observations;Actions\n";
    for (let d of data) {
        csv += (d.date || '') + ';';
        csv += (d.heure || '') + ';';
        csv += (d.temperature || '') + ';';
        csv += (d.pression || '') + ';';
        csv += (d.intensite || '') + ';';
        csv += (d.consommation || '') + ';';
        csv += (d.etatCompresseur || '') + ';';
        csv += (d.tensionBatterie || '') + ';';
        csv += (d.productionSolaire || '') + ';';
        csv += (d.pressionHuile || '') + ';';
        csv += (d.tempExterieure || '') + ';';
        csv += (d.observations || '') + ';';
        csv += (d.actions || '') + '\n';
    }
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], {type: 'text/csv'}));
    a.download = 'calendrier_' + (moisActuel+1) + '_' + anneeActuelle + '.csv';
    a.click();
}

function exporterCSVHistorique() {
    let csv = "Date,Température,Nom,Solaire\n";
    for (let r of releves) csv += '"' + r.date + '",' + r.temperature + ',"' + r.nom + '","' + r.solaire + '"\n';
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = 'historique_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
}

function effacerHistorique() {
    if (confirm('Effacer TOUT l\'historique ?')) { taches = []; releves = []; alertes = []; sauvegarder(); rafraichir(); }
}

function afficherPageTechnicien() {
    afficherAlertesTechnicien();
    afficherTachesTechnicien();
    afficherMaintenancesPlanifiees();
    afficherInterventions();
}

function afficherAlertesTechnicien() {
    let alertesNonTraitees = alertes.filter(a => !a.traite);
    if (alertesNonTraitees.length === 0) { document.getElementById('alertesList').innerHTML = '<p>Aucune alerte</p>'; return; }
    let html = '';
    for (let i = alertesNonTraitees.length - 1; i >= 0; i--) {
        let a = alertesNonTraitees[i];
        html += '<div class="tache-urgent"><strong>📅 ' + a.date + '</strong><br>👤 ' + a.nom + ' - 📞 ' + a.tel + '<br>🔧 ' + a.composant + '<br>📝 ' + a.description + '<br>🔊 ' + a.bruit + '<br>⚡ ' + a.urgence + '<button class="btn-small" onclick="contacterMorguier(\'' + a.tel + '\')">📞 Contacter</button><button class="btn-small" onclick="traiterAlerte(' + a.id + ')">✅ Traité</button></div>';
    }
    document.getElementById('alertesList').innerHTML = html;
}

function contacterMorguier(tel) { alert('📞 Contacter le responsable: ' + tel); }

function traiterAlerte(id) {
    let a = alertes.find(a => a.id === id);
    if (a) { a.traite = true; sauvegarder(); afficherPageTechnicien(); rafraichir(); }
}

function afficherTachesTechnicien() {
    let tachesNonFaites = taches.filter(t => !t.fini);
    if (tachesNonFaites.length === 0) { document.getElementById('tachesTechnicienList').innerHTML = '<p>✅ Aucune tâche</p>'; return; }
    let html = '';
    for (let i = tachesNonFaites.length - 1; i >= 0; i--) {
        let t = tachesNonFaites[i];
        html += '<div class="' + (t.type === 'URGENT' ? 'tache-urgent' : 'tache-preventif') + '"><strong>📅 ' + t.date + '</strong><br>🔧 ' + t.composant + '<br>📋 ' + t.action + '<br><button class="btn-small" onclick="terminerTacheTechnicien(' + t.id + ')">✓ Terminer</button></div>';
    }
    document.getElementById('tachesTechnicienList').innerHTML = html;
}

function terminerTacheTechnicien(id) {
    let t = taches.find(t => t.id === id);
    if (t) { t.fini = true; interventions.push({ id: Date.now(), date: new Date().toLocaleString(), composant: t.composant, action: t.action, type: 'Tâche' }); sauvegarder(); afficherPageTechnicien(); rafraichir(); }
}

function afficherInterventions() {
    let interventions = JSON.parse(localStorage.getItem('gmao_interventions') || '[]');
    let container = document.getElementById('interventionsList');
    if (!container) return;
    
    if (interventions.length === 0) {
        container.innerHTML = '<p>Aucune intervention</p>';
        return;
    }
    
    let html = '';
    for (let i = interventions.length - 1; i >= 0; i--) {
        let inter = interventions[i];
        html += `<div style="padding:8px; border-bottom:1px solid #ddd;">
            <strong>📅 ${inter.date}</strong><br>
            🔧 ${inter.composant}<br>
            ✅ ${inter.action}
        </div>`;
    }
    container.innerHTML = html;
}

function supprimerToutesInterventions() {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les interventions ? Cette action est définitive.')) {
        // Vider le tableau des interventions
        interventions = [];
        // Sauvegarder dans localStorage
        localStorage.setItem('gmao_interventions', JSON.stringify(interventions));
        // Rafraîchir l'affichage
        afficherInterventions();
        // Afficher un message de confirmation
        alert('✅ Toutes les interventions ont été supprimées');
        // Recharger la page technicien pour être sûr
        if (typeof afficherPageTechnicien === 'function') {
            afficherPageTechnicien();
        }
    }
}

function toggleChatbot() {
    let b = document.getElementById('chatbotBody');
    if (b) b.style.display = b.style.display === 'none' ? 'flex' : 'none';
}

function envoyerMessageChatbot() {
    let input = document.getElementById('chatInput');
    let message = input.value.trim();
    if (!message) return;
    let chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    chatMessages.innerHTML += '<div class="user-message">' + message + '</div>';
    setTimeout(() => repondreChatbot(message), 500);
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function repondreChatbot(message) {
    let msg = message.toLowerCase();
    let reponse = "";
    
    // ========== 1. COMPRESSEUR (5 sujets) ==========
    if (msg.includes('compresseur') && (msg.includes('marche') || msg.includes('fonctionne') || msg.includes('démarre') || msg.includes('ne démarre'))) {
        reponse = "🔧 Problème de compresseur qui ne démarre pas :\n\n1. Vérifiez le disjoncteur (position ON)\n2. Vérifiez les connexions électriques\n3. Vérifiez la pression d'huile\n4. Écoutez s'il y a un bourdonnement\n5. Vérifiez le condensateur de démarrage\n\nSi le problème persiste, utilisez le formulaire de signalement pour alerter le technicien.";
    }
    else if (msg.includes('compresseur') && msg.includes('bruit')) {
        reponse = "🔊 Bruit anormal du compresseur :\n\n• Claquement → Vérifiez les soupapes\n• Sifflement → Fuite possible de gaz\n• Grincement → Roulements usés\n• Vibration → Mauvais équilibrage\n\nSignalez immédiatement au technicien.";
    }
    else if (msg.includes('compresseur') && msg.includes('chauffe')) {
        reponse = "🌡️ Compresseur qui chauffe trop :\n\n1. Vérifiez la ventilation autour\n2. Contrôlez le niveau d'huile\n3. Vérifiez la pression de refoulement\n4. Nettoyez le condenseur\n\nUne surchauffe peut endommager le compresseur.";
    }
    else if (msg.includes('compresseur') && msg.includes('huile')) {
        reponse = "🛢️ Pression d'huile du compresseur :\n\n1. Niveau normal : entre 1.5 et 3 bar\n2. Vérifiez les fuites d'huile\n3. Changez l'huile tous les 5000 heures\n4. Utilisez de l'huile POE pour R410A\n\nUne pression trop basse peut endommager le compresseur.";
    }
    else if (msg.includes('compresseur') && msg.includes('copeland')) {
        reponse = "🔧 Compresseur Copeland :\n\n• Marque fiable recommandée\n• Vérifiez la plaque signalétique\n• Entretien tous les 6 mois\n• Pièces de rechange disponibles\n\nContacter le fournisseur pour les réparations.";
    }
    
    // ========== 2. ÉVAPORATEUR (4 sujets) ==========
    else if (msg.includes('évaporateur') || msg.includes('evaporateur')) {
        if (msg.includes('givre') || msg.includes('gel')) {
            reponse = "❄️ Évaporateur qui givre :\n\n1. Givre excessif → dégivrez manuellement\n2. Vérifiez la sonde de dégivrage\n3. Contrôlez la résistance de dégivrage\n4. Vérifiez le programmateur\n5. Nettoyez les ailettes\n\nUn givre trop épais réduit les performances.";
        }
        else if (msg.includes('ne refroidit') || msg.includes('pas froid')) {
            reponse = "🌡️ Évaporateur ne refroidit pas :\n\n1. Vérifiez le ventilateur\n2. Contrôlez la pression de gaz\n3. Nettoyez les ailettes encrassées\n4. Vérifiez le détendeur\n5. Contrôlez la charge de gaz\n\nSignalez au technicien.";
        }
        else if (msg.includes('fuite')) {
            reponse = "💧 Fuite d'eau au niveau de l'évaporateur :\n\n1. Vérifiez le bac de récupération\n2. Contrôlez le tuyau d'évacuation\n3. Vérifiez que l'évaporateur n'est pas obstrué\n4. Nettoyez le bac\n\nUne fuite non traitée peut endommager l'isolation.";
        }
        else {
            reponse = "❄️ Évaporateur - Maintenance préventive :\n\n1. Nettoyage tous les 3 mois\n2. Vérification des ailettes\n3. Contrôle du dégivrage\n4. Inspection des fixations\n\nUn entretien régulier prolonge la durée de vie.";
        }
    }
    
    // ========== 3. CONDENSEUR (3 sujets) ==========
    else if (msg.includes('condenseur')) {
        if (msg.includes('sale') || msg.includes('poussière') || msg.includes('encrassé')) {
            reponse = "🧹 Condenseur encrassé :\n\n1. Nettoyez avec de l'air comprimé\n2. Utilisez une brosse douce\n3. Ne pas utiliser d'eau sous pression\n4. Nettoyez tous les 3 mois\n\nUn condenseur sale augmente la consommation électrique.";
        }
        else if (msg.includes('chauffe') || msg.includes('surchauffe')) {
            reponse = "🌡️ Condenseur qui surchauffe :\n\n1. Vérifiez la ventilation\n2. Nettoyez les grilles d'air\n3. Vérifiez le ventilateur du condenseur\n4. Contrôlez la pression\n5. Éloignez les sources de chaleur\n\nUne surchauffe réduit l'efficacité du système.";
        }
        else {
            reponse = "🌡️ Condenseur - Maintenance :\n\n1. Nettoyage des ailettes\n2. Vérification du ventilateur\n3. Contrôle de la pression\n4. Inspection des soudures\n\nUn condenseur entretenu dure plus longtemps.";
        }
    }
    
    // ========== 4. GAZ R404A (3 sujets) ==========
    else if (msg.includes('gaz') || msg.includes('r404a') || msg.includes('fluide')) {
        if (msg.includes('fuite')) {
            reponse = "💨 Fuite de gaz R404A :\n\n1. Utilisez un détecteur électronique\n2. Ou de l'eau savonneuse (bulles)\n3. Réparez la fuite immédiatement\n4. Rechargez le circuit\n5. Vérifiez les soudures\n\n⚠️ Urgence : Alertez le technicien !";
        }
        else if (msg.includes('pression') || msg.includes('manque')) {
            reponse = "📊 Pression du gaz R410A :\n\n• Pression normale au repos : 8-10 bar\n• Pression en fonctionnement : 12-15 bar\n• Pression trop basse → fuite\n• Pression trop haute → surcharge\n\nUn manomètre est nécessaire pour mesurer.";
        }
        else {
            reponse = "💨 Gaz frigorigène R404A :\n\n• Gaz écologique (ne détruit pas l'ozone)\n• Pression plus élevée que R404A\n• Ne pas mélanger avec d'autres gaz\n• Manipulation par personnel qualifié\n\nLa recharge doit être faite par un technicien.";
        }
    }
    
    // ========== 5. TEMPÉRATURE (4 sujets) ==========
    else if (msg.includes('température')) {
        if (msg.includes('trop élevée') || msg.includes('chaude') || msg.includes('>')) {
            reponse = "🌡️ Température trop élevée (>5°C) :\n\n1. Vérifiez que les portes sont bien fermées\n2. Vérifiez les joints d'étanchéité\n3. Vérifiez le niveau de gaz\n4. Nettoyez le condenseur\n5. Vérifiez l'évaporateur\n\nUtilisez le formulaire de relevé pour enregistrer la température exacte.";
        }
        else if (msg.includes('trop basse') || msg.includes('négative') || msg.includes('<')) {
            reponse = "❄️ Température trop basse (<0°C) :\n\n1. Vérifiez le réglage du thermostat\n2. Risque de gel des produits\n3. Vérifiez la sonde de température\n4. Calibrez le thermostat\n\nTempérature normale : 0°C à 5°C";
        }
        else if (msg.includes('normale')) {
            reponse = "🌡️ Température normale :\n\n• Chambre froide mortuaire : 0°C à 5°C\n• Relevé quotidien matin et soir\n• Alerte si >5°C\n• Urgence si >7°C\n\nUtilisez le calendrier pour enregistrer les relevés.";
        }
        else {
            reponse = "🌡️ Gestion de la température :\n\n1. Relevés quotidiens dans le calendrier\n2. Température normale : 0-5°C\n3. Alerte orange à 5°C\n4. Alerte rouge à 7°C\n5. Graphique d'évolution disponible\n\nUtilisez le formulaire de signalement en cas d'anomalie.";
        }
    }
    
    // ========== 6. THERMOSTAT (2 sujets) ==========
    else if (msg.includes('thermostat')) {
        if (msg.includes('réglage') || msg.includes('calibrer')) {
            reponse = "🎛️ Réglage du thermostat :\n\n1. Température cible : 2°C à 4°C\n2. Ne pas descendre en dessous de 0°C\n3. Utiliser un thermomètre de référence\n4. Calibration annuelle recommandée\n\nUn mauvais réglage peut causer du givre.";
        }
        else {
            reponse = "🌡️ Thermostat - Vérification :\n\n1. Comparez avec un thermomètre fiable\n2. Écart > 1°C → sonde à remplacer\n3. Vérifiez le câblage\n4. Testez le cycle de fonctionnement\n\nUn thermostat précis est essentiel.";
        }
    }
    
    // ========== 7. VENTILATEUR (2 sujets) ==========
    else if (msg.includes('ventilateur')) {
        if (msg.includes('bruit') || msg.includes('grincement')) {
            reponse = "🔊 Ventilateur bruyant :\n\n1. Grincement → roulements usés\n2. Claquement → pale qui touche\n3. Vibration → déséquilibre\n4. Nettoyez les pales\n5. Graissez les roulements\n\nUn ventilateur défectueux réduit le débit d'air.";
        }
        else {
            reponse = "💨 Ventilateur - Contrôle :\n\n1. Vérifiez la rotation\n2. Nettoyez les pales de poussière\n3. Vérifiez le moteur\n4. Testez les vitesses\n5. Écoutez les bruits anormaux\n\nNettoyage recommandé tous les 3 mois.";
        }
    }
    
    // ========== 8. PANNEAUX SOLAIRES (5 sujets) ==========
    else if (msg.includes('panneau') || msg.includes('solaire') || msg.includes('photovoltaïque') || msg.includes('pv')) {
        if (msg.includes('ne produit') || msg.includes('production') || msg.includes('faible')) {
            reponse = "☀️ Production solaire faible :\n\n1. Nettoyez les panneaux (eau + éponge douce)\n2. Vérifiez qu'il n'y a pas d'ombrage\n3. Vérifiez l'orientation (plein sud)\n4. Contrôlez l'inclinaison\n5. Vérifiez les connexions\n6. Inspectez les câbles\n\nPerte > 20% → signaler au technicien.";
        }
        else if (msg.includes('cassé') || msg.includes('fissuré') || msg.includes('brisé')) {
            reponse = "⚠️ Panneau solaire cassé :\n\n1. Ne touchez pas les parties exposées\n2. Coupez l'alimentation\n3. Isolez le panneau défectueux\n4. Remplacement nécessaire\n5. Danger : risque électrique\n\nContactez immédiatement le technicien.";
        }
        else if (msg.includes('nettoyage') || msg.includes('propre')) {
            reponse = "🧹 Nettoyage des panneaux solaires :\n\n1. Fréquence : tous les 15 jours\n2. Utilisez de l'eau et une éponge douce\n3. Ne pas utiliser de produits agressifs\n4. Ne pas marcher sur les panneaux\n5. Nettoyez tôt le matin\n\nUn panneau propre produit plus d'énergie.";
        }
        else if (msg.includes('orientation') || msg.includes('inclinaison')) {
            reponse = "📐 Orientation des panneaux solaires :\n\n• Orientation idéale : plein sud\n• Inclinaison : latitude du lieu (≈6°)\n• Azimut : 0° (sud)\n• À vérifier avec une boussole\n\nUne mauvaise orientation réduit la production.";
        }
        else {
            reponse = "☀️ Panneaux photovoltaïques :\n\n• Nettoyage tous les 15 jours\n• Production normale : 5-10 kWh/jour\n• Durée de vie : 20-25 ans\n• Vérifiez l'ombrage\n• Inspection visuelle régulière\n\nUtilisez le calendrier pour noter la production.";
        }
    }
    
    // ========== 9. BATTERIES (5 sujets) ==========
    else if (msg.includes('batterie')) {
        if (msg.includes('tension') || msg.includes('charge')) {
            reponse = "🔋 Tension des batteries :\n\n• Batterie 12V : normale 12V-13.5V\n• Batterie 48V : normale 46V-54V\n• Tension basse (<11.5V) → déchargée\n• Tension haute (>14.5V) → surcharge\n• Mesurez avec un voltmètre\n\nVérification mensuelle recommandée.";
        }
        else if (msg.includes('décharge') || msg.includes('faible')) {
            reponse = "🔋 Batterie déchargée :\n\n1. Vérifiez les connexions\n2. Testez la tension\n3. Vérifiez le régulateur\n4. Chargez complètement\n5. Si tension < 47.5V → remplacement\n\nÉvitez les décharges profondes (<20%).";
        }
        else if (msg.includes('corrosion') || msg.includes('borne')) {
            reponse = "🔧 Nettoyage des bornes de batterie :\n\n1. Débranchez les câbles\n2. Utilisez une brosse métallique\n3. Appliquez de la vaseline technique\n4. Reserrez fermement\n5. Vérifiez l'oxydation\n\nDes bornes propres évitent les pertes.";
        }
        else if (msg.includes('remplacement')) {
            reponse = "🔄 Remplacement des batteries :\n\n• Durée de vie : 5-7 ans\n• Test de capacité annuel\n• Remplacer par paires identiques\n• Type : Lithium ou AGM\n• Recyclage obligatoire\n\nBudget à prévoir pour le remplacement.";
        }
        else {
            reponse = "🔋 Batteries de stockage :\n\n• Vérification mensuelle de tension\n• Nettoyage des bornes\n• Éviter les décharges profondes\n• Température ambiante 15-25°C\n• Durée de vie 5-7 ans\n\nBatteries bien entretenues = autonomie garantie.";
        }
    }
    
    // ========== 10. ONDULEUR (4 sujets) ==========
    else if (msg.includes('onduleur') || msg.includes('mppt')) {
        if (msg.includes('panne') || msg.includes('ne démarre') || msg.includes('erreur')) {
            reponse = "⚡ Onduleur en panne :\n\n1. Vérifiez les voyants LED\n2. Redémarrez l'onduleur\n3. Vérifiez les fusibles\n4. Contrôlez la ventilation\n5. Vérifiez la batterie\n\nCode erreur → consulter la notice.";
        }
        else if (msg.includes('ventilation') || msg.includes('chauffe')) {
            reponse = "🌡️ Onduleur qui chauffe :\n\n1. Vérifiez les grilles de ventilation\n2. Nettoyez la poussière\n3. Vérifiez le ventilateur\n4. Éloignez les sources de chaleur\n5. Température maxi : 50°C\n\nUne surchauffe peut endommager l'onduleur.";
        }
        else if (msg.includes('hybride')) {
            reponse = "⚡ Onduleur hybride :\n\n• Gère solaire + réseau + batterie\n• Priorité à l'énergie solaire\n• Bascule automatique\n• Programmation possible\n• Consultation du manuel\n\nPermet l'optimisation énergétique.";
        }
        else {
            reponse = "⚡ Onduleur / MPPT :\n\n• Contrôle des voyants chaque semaine\n• Nettoyage ventilation\n• Vérification des fusibles\n• Température de fonctionnement\n• Redémarrage si erreur\n\nUn onduleur bien entretenu = alimentation stable.";
        }
    }
    
    // ========== 11. RÉGULATEUR (3 sujets) ==========
    else if (msg.includes('régulateur') || msg.includes('regulateur')) {
        if (msg.includes('charge')) {
            reponse = "📊 Régulateur de charge :\n\n• Vérifiez la tension de charge\n• Courant de charge normal\n• Évitez la surcharge\n• Protection contre les inversions\n• Test mensuel recommandé\n\nUn bon régulateur protège les batteries.";
        }
        else if (msg.includes('paramètre') || msg.includes('réglage')) {
            reponse = "⚙️ Réglage du régulateur :\n\n• Tension flottante : 13.5-13.8V\n• Tension d'absorption : 14.2-14.5V\n• Tension de déconnexion : 11.5V\n• Consultez le manuel\n\nParamètres à vérifier par un technicien.";
        }
        else {
            reponse = "📊 Régulateur MPPT :\n\n• Optimise la production solaire\n• Convertit le surplus en charge\n• Protection des batteries\n• Affichage des paramètres\n• Surveillance régulière\n\nAméliore le rendement énergétique.";
        }
    }
    
    // ========== 12. MAINTENANCE (5 sujets) ==========
    else if (msg.includes('maintenance préventive') || (msg.includes('maintenance') && msg.includes('préventive'))) {
        reponse = "📋 Maintenance préventive :\n\nPlanification recommandée :\n• Hebdomadaire : vérification visuelle\n• Mensuelle : nettoyage, contrôles\n• Trimestrielle : tests approfondis\n• Annuelle : révision complète\n\nCalendrier disponible dans l'espace responsable.";
    }
    else if (msg.includes('maintenance corrective') || (msg.includes('maintenance') && msg.includes('corrective'))) {
        reponse = "🔧 Maintenance corrective :\n\n1. Identifiez la panne\n2. Utilisez le formulaire de signalement\n3. Le technicien reçoit l'alerte\n4. Intervention rapide\n5. Validation après réparation\n\nRéactivité garantie pour les urgences.";
    }
    else if (msg.includes('planification') || msg.includes('planifier')) {
        reponse = "📅 Planification des maintenances :\n\n1. Allez dans l'espace responsable\n2. Utilisez le formulaire 'Planifier maintenance'\n3. Choisissez la date, le composant\n4. Assignez un technicien\n5. Validez\n\nLes maintenances planifiées apparaissent dans les tâches.";
    }
    else if (msg.includes('tâche') || msg.includes('tache')) {
        reponse = "📋 Gestion des tâches :\n\n• Liste des maintenances à faire\n• Urgentes en rouge\n• Préventives en orange\n• Bouton 'Terminer' pour valider\n• Historique conservé\n\nConsultez régulièrement les tâches.";
    }
    else if (msg.includes('rapport') || msg.includes('export')) {
        reponse = "📊 Export des données :\n\n• CSV : calendrier mensuel\n• CSV : historique complet\n• Utilisation dans Excel\n• Impression possible\n• Archivage des données\n\nExportez régulièrement pour sauvegarde.";
    }
    
    // ========== 13. SÉCURITÉ (4 sujets) ==========
    else if (msg.includes('sécurité') || msg.includes('danger')) {
        reponse = "⚠️ Consignes de sécurité :\n\n1. Coupez toujours l'alimentation avant intervention\n2. Portez des gants isolants\n3. Ne touchez pas les composants sous tension\n4. Utilisez des outils isolés\n5. Ne travaillez jamais seul\n\nLa sécurité est primordiale.";
    }
    else if (msg.includes('urgence') || msg.includes('alerte')) {
        reponse = "🚨 En cas d'urgence :\n\n1. Utilisez le formulaire de signalement\n2. Niveau d'urgence : Critique\n3. Décrivez précisément le problème\n4. Le technicien est alerté immédiatement\n5. Ajoutez une photo si possible\n\nUne réponse rapide est garantie.";
    }
    else if (msg.includes('électrocution') || msg.includes('choc')) {
        reponse = "⚡ Risque électrique :\n\n• Toujours couper l'alimentation\n• Vérifiez l'absence de tension\n• Ne pas travailler en cas d'humidité\n• Utilisez un tapis isolant\n• Portez des équipements de protection\n\nEn cas d'accident, appelez les secours.";
    }
    else if (msg.includes('incendie') || msg.includes('feu')) {
        reponse = "🔥 Risque incendie :\n\n1. Coupez l'alimentation générale\n2. Utilisez un extincteur adapté (CO2)\n3. Ne pas utiliser d'eau\n4. Évacuez la zone\n5. Alertez les pompiers\n\nPrévention : vérifiez les câbles régulièrement.";
    }
    
    // ========== 14. ÉCONOMIE D'ÉNERGIE (3 sujets) ==========
    else if (msg.includes('économie') || msg.includes('consommation') || msg.includes('énergie')) {
        if (msg.includes('réduction')) {
            reponse = "📉 Réduction de consommation :\n\n1. Maintenance préventive régulière\n2. Nettoyage des échangeurs\n3. Vérification de l'isolation\n4. Optimisation du dégivrage\n5. Horaires de fonctionnement\n\nJusqu'à 30% d'économies possibles.";
        }
        else {
            reponse = "📊 Optimisation énergétique :\n\n• Entretien régulier des équipements\n• Nettoyage des panneaux solaires\n• Vérification des batteries\n• Isolation des portes\n• Suivi des consommations\n\nSuivez les indicateurs dans l'application.";
        }
    }
    else if (msg.includes('performance')) {
        reponse = "📈 Performance énergétique :\n\n• COP (Coefficient de Performance)\n• Suivi des températures\n• Production solaire journalière\n• Consommation électrique\n• Indicateurs MTBF/MTTR\n\nDes équipements performants = économies.";
    }
    
    // ========== 15. NOUVEAUX SUJETS (équipements supplémentaires) ==========
    else if (msg.includes('détendeur')) {
        reponse = "🔧 Détendeur thermostatique :\n\n• Régule le flux de gaz\n• Vérifiez la surchauffe (5-8°C)\n• Nettoyez le filtre\n• Testez le bulbe\n• Un détendeur bloqué = panne\n\nIntervention par technicien qualifié.";
    }
    else if (msg.includes('filtre') || msg.includes('déshydrateur')) {
        reponse = "🧹 Filtre déshydrateur :\n\n• Absorbe l'humidité\n• À remplacer tous les 2 ans\n• Signe d'obstruction : différence de température\n• Vérifiez la pression différentielle\n• Essentiel pour protéger le compresseur\n\nUn filtre saturé = performances réduites.";
    }
    else if (msg.includes('sonde') || msg.includes('capteur')) {
        reponse = "🌡️ Sondes et capteurs :\n\n• Sonde de température : précision ±0.5°C\n• Sonde de pression\n• Capteur de dégivrage\n• Test annuel recommandé\n• Remplacer si écart > 1°C\n\nDes capteurs précis = fonctionnement optimal.";
    }
    else if (msg.includes('câble') || msg.includes('cablage') || msg.includes('connexion')) {
        reponse = "🔌 Câblage électrique :\n\n1. Inspection visuelle tous les 3 mois\n2. Vérifiez le serrage des bornes\n3. Recherchez l'oxydation\n4. Contrôlez les fusibles\n5. Testez la continuité\n\nUn mauvais câblage peut causer des pannes.";
    }
    else if (msg.includes('disjoncteur')) {
        reponse = "⚡ Disjoncteur :\n\n• Vérifiez la position (ON/OFF)\n• Un disjoncteur qui saute = surcharge\n• Testez le réarmement\n• Calibre adapté à l'équipement\n• Remplacer si défectueux\n\nUn disjoncteur protège votre installation.";
    }
    else if (msg.includes('fusible')) {
        reponse = "🔌 Fusibles :\n\n• Vérifiez visuellement (fil intact)\n• Testez avec un multimètre\n• Remplacez par le même calibre\n• Fusible qui grille = court-circuit\n• Calibre adapté : ne pas surmener\n\nGardez des fusibles de rechange.";
    }
    else if (msg.includes('relais') || msg.includes('contacteur')) {
        reponse = "🔘 Relais et contacteurs :\n\n• Écoutez le clic d'enclenchement\n• Vérifiez les contacts (noircis = usés)\n• Testez la bobine\n• Nettoyez ou remplacez\n• Un relais défaillant = coupure intempestive\n\nVérification lors des maintenances.";
    }
    else if (msg.includes('programmateur') || msg.includes('horloge')) {
        reponse = "⏰ Programmateur / Horloge :\n\n• Vérifiez le réglage de l'heure\n• Contrôlez les cycles programmés\n• Testez le dégivrage horaire\n• Pile de secours si nécessaire\n• Re-programmation si décalage\n\nUn mauvais réglage peut bloquer le dégivrage.";
    }
    else if (msg.includes('résistance') || msg.includes('dégivrage')) {
        reponse = "🔥 Résistance de dégivrage :\n\n• Vérifiez la continuité (multimètre)\n• Résistance normale : 50-200 ohms\n• Infinie = coupée\n• Testez le cycle de dégivrage\n• Remplacer si défectueuse\n\nSans dégivrage, l'évaporateur gèle.";
    }
    else if (msg.includes('vanne') || msg.includes('4 voies')) {
        reponse = "🔧 Vanne 4 voies :\n\n• Utilisée pour le dégivrage\n• Écoutez le bruit d'inversion\n• Pas de bruit = vanne bloquée\n• Vérifiez la bobine\n• Intervention par technicien\n\nUne vanne bloquée empêche le dégivrage.";
    }
    
    // ========== 16. FUITES ET PROBLÈMES DIVERS (4 sujets) ==========
    else if (msg.includes('fuite') && (msg.includes('eau') || msg.includes('liquide'))) {
        reponse = "💧 Fuite d'eau détectée :\n\n1. Coupez immédiatement l'alimentation\n2. Placez un récipient sous la fuite\n3. Identifiez la source (évaporateur, joint)\n4. Vérifiez le bac de récupération\n5. Nettoyez le tuyau d'évacuation\n\nURGENCE : Alertez le technicien immédiatement !";
    }
    else if (msg.includes('fuite') && (msg.includes('gaz') || msg.includes('frigorigène'))) {
        reponse = "💨 Fuite de gaz frigorigène :\n\n1. Aérez la pièce\n2. Ne pas rester dans la zone\n3. Coupez l'alimentation\n4. Évacuez si odeur forte\n5. Alertez le technicien URGENCE\n\n⚠️ Danger : gaz sous pression !";
    }
    else if (msg.includes('odeur') || msg.includes('brûlé')) {
        reponse = "👃 Odeur suspecte :\n\n• Brûlé = surchauffe électrique\n• Gaz = fuite de frigorigène\n• Moisi = humidité stagnante\n• Coupez l'alimentation\n• Alertez immédiatement\n\nNe restez pas dans la zone.";
    }
    else if (msg.includes('panne') || msg.includes('coupure')) {
        reponse = "⚠️ En cas de panne :\n\n1. Utilisez le formulaire de signalement\n2. Décrivez précisément le problème\n3. Ajoutez une photo si possible\n4. Le technicien est alerté par email\n5. Intervention rapide\n\nNe tentez pas de réparer vous-même.";
    }
    
    // ========== 17. INFORMATIONS GÉNÉRALES (4 sujets) ==========
    else if (msg.includes('contact') || msg.includes('téléphone') || msg.includes('appeler')) {
        reponse = "📞 Contacts utiles :\n\n• Personne d'urgence : +229 01 91 47 32 41\n• Technicien maintenance : +229 01 66 55 55 69\n• Standard hôpital : +229 21 33 21 78\n• Email : infos@sante.gouv.bj\n\nCes numéros sont disponibles sur la page d'accueil.";
    }
    else if (msg.includes('documentation') || msg.includes('notice')) {
        reponse = "📚 Documentation disponible :\n\n• Notice technique (page d'accueil)\n• Tutoriels d'utilisation\n• FAQ - Foire aux questions\n• Liens dans l'espace responsable\n\nConsultez régulièrement les mises à jour.";
    }
    else if (msg.includes('qr') || msg.includes('code')) {
        reponse = "📱 QR Code :\n\n• Imprimable depuis l'espace responsable\n• À coller sur la chambre froide\n• Scannez pour accéder au site\n• Utilisable sur tous les réseaux\n• Accès rapide au formulaire\n\nUn QR code est disponible dans l'application.";
    }
    else if (msg.includes('aide') || msg.includes('assistance')) {
        reponse = "🆘 Aide et assistance :\n\n1. Utilisez ce chatbot pour les questions simples\n2. Consultez la FAQ dans les liens utiles\n3. Pour une panne : formulaire de signalement\n4. Urgence : appelez la personne d'urgence\n5. Le technicien est alerté automatiquement\n\nNous sommes là pour vous aider !";
    }
    
    // ========== RÉPONSE PAR DÉFAUT ==========
    else {
        reponse = "🤖 Je suis l'assistant GMAO.\n\nVous pouvez me poser des questions sur :\n\n❄️ GROUPE FROID :\n• Compresseur (panne, bruit, huile,)\n• Évaporateur (givre, refroidissement, fuite)\n• Condenseur (encrassement, surchauffe)\n• Gaz R404A (fuite, pression)\n• Thermostat, ventilateur, détendeur, filtre\n\n☀️ ÉNERGIE SOLAIRE :\n• Panneaux photovoltaïques (production, nettoyage)\n• Batteries (tension, décharge, remplacement)\n• Onduleur / MPPT (panne, ventilation, hybride)\n• Régulateur de charge\n\n📋 MAINTENANCE :\n• Maintenance préventive et corrective\n• Planification des tâches\n• Export des données (CSV)\n\n🔧 DÉPANNAGE :\n• Fuites (eau, gaz)\n• Sécurité électrique\n• Urgences et alertes\n\nSinon, utilisez le formulaire de signalement pour alerter le technicien immédiatement.";
    }
    
    let chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML += '<div class="bot-message">' + reponse.replace(/\n/g, '<br>') + '</div>';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function rafraichir() {
    afficherStats();
    afficherTaches();
    afficherHistorique();
    if (document.getElementById('pageResponsable').style.display !== 'none') afficherCalendrier();
}

function verifierConnexionExistante() {
    let role = localStorage.getItem('gmao_role');
    
    if (role === 'responsable') {
        document.getElementById('pageAccueil').style.display = 'none';
        document.getElementById('pageConnexion').style.display = 'none';
        document.getElementById('pageResponsable').style.display = 'block';
        chargerDonnees();
        afficherCalendrier();
        rafraichir();
        initialiserGraphique();
        mettreAJourStatsAccueil();  // Met à jour les 4 cartes
    } 
    else if (role === 'technicien') {
        document.getElementById('pageAccueil').style.display = 'none';
        document.getElementById('pageConnexionTechnicien').style.display = 'none';
        document.getElementById('pageTechnicien').style.display = 'block';
        chargerDonnees();
        afficherCalendrierTechnicien();
        afficherPageTechnicien();
        initialiserGraphiqueTechnicien();
    }
}
// ========== GESTION DU NOM DU RESPONSABLE ==========
function getNomResponsable() {
    let nom = localStorage.getItem('nom_responsable');
    if (!nom) {
        nom = prompt("📝 Veuillez entrer votre nom (responsable morgue) :", "Jean KOUASSI");
        if (nom && nom.trim() !== '') {
            localStorage.setItem('nom_responsable', nom.trim());
            return nom.trim();
        } else {
            return "Responsable morgue";
        }
    }
    return nom;
}

function modifierNomResponsable() {
    let nouveauNom = prompt("📝 Modifier votre nom :", localStorage.getItem('nom_responsable') || "Responsable morgue");
    if (nouveauNom && nouveauNom.trim() !== '') {
        localStorage.setItem('nom_responsable', nouveauNom.trim());
        alert('✅ Nom mis à jour : ' + nouveauNom);
        rafraichir();
    }
}
changerDonneesCloud();
verifierConnexionExistante();
