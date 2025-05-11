// space-view.js - Visualisation spatiale pour Triangle Meditation Network

// Ajout des traductions pour la vue spatiale
(function() {
    // Ajouter les traductions pour chaque langue
    const spaceTranslations = {
        en: {
            viewFromSpace: "View from Space",
            viewMap: "View Map"
        },
        fr: {
            viewFromSpace: "Vue de l'Espace",
            viewMap: "Vue Carte"
        },
        es: {
            viewFromSpace: "Vista desde el Espacio",
            viewMap: "Vista Mapa"
        },
        de: {
            viewFromSpace: "Ansicht aus dem Weltraum",
            viewMap: "Kartenansicht"
        },
        it: {
            viewFromSpace: "Vista dallo Spazio",
            viewMap: "Vista Mappa"
        },
        ru: {
            viewFromSpace: "Вид из космоса",
            viewMap: "Вид карты"
        }
    };

    // Ajouter ces traductions à l'objet existant
    for (const lang in spaceTranslations) {
        if (window.appData.translations[lang]) {
            Object.assign(window.appData.translations[lang], spaceTranslations[lang]);
        }
    }
})();

// État de la vue spatiale
window.spaceViewState = {
    scene: null,
    camera: null,
    renderer: null,
    earth: null,
    triangleLines: [],
    participants: [],
    controls: null,
    isActive: false,
    animationId: null
};

// Initialiser la vue de l'espace
function initSpaceView() {
    // Ne réinitialisez pas si déjà initialisé
    if (window.spaceViewState.scene) return;
    
    const container = document.getElementById('space-view');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Créer la scène
    const scene = new THREE.Scene();
    window.spaceViewState.scene = scene;
    
    // Créer la caméra
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;
    window.spaceViewState.camera = camera;
    
    // Créer le renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);
    window.spaceViewState.renderer = renderer;
    
    // Ajouter les contrôles OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    window.spaceViewState.controls = controls;
    
    // Ajouter une lumière ambiante
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    // Ajouter une lumière directionnelle (comme le soleil)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    
    // Créer la Terre
    createEarth();
    
    // Ajouter un fond étoilé
    createStarBackground();
    
    // Ajuster les dimensions lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        if (!window.spaceViewState.isActive) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
    });
}

// Créer le globe terrestre
function createEarth() {
    const scene = window.spaceViewState.scene;
    
    // Charger la texture de la Terre
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg');
    const earthBumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg');
    const earthSpecular = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');
    
    // Créer la géométrie et le matériau pour la Terre
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: earthBumpMap,
        bumpScale: 0.05,
        specularMap: earthSpecular,
        specular: new THREE.Color(0x333333),
        shininess: 5
    });
    
    // Créer le mesh de la Terre et l'ajouter à la scène
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    window.spaceViewState.earth = earth;
    
    // Ajouter une atmosphère subtile
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x3388ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
}

// Créer un fond étoilé
function createStarBackground() {
    const scene = window.spaceViewState.scene;
    
    // Créer des étoiles
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        
        // Ne pas placer d'étoiles trop près de la Terre
        if (Math.sqrt(x*x + y*y + z*z) < 10) continue;
        
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// Convertir les coordonnées géographiques (lat/long) en coordonnées 3D
function latLongToVector3(lat, long, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (long + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}

// Créer les triangles de méditation en 3D
function createMeditationTriangles3D() {
    const scene = window.spaceViewState.scene;
    
    // Supprimer les triangles existants
    window.spaceViewState.triangleLines.forEach(line => {
        scene.remove(line);
    });
    window.spaceViewState.triangleLines = [];
    
    // Supprimer les points des participants
    window.spaceViewState.participants.forEach(point => {
        scene.remove(point);
    });
    window.spaceViewState.participants = [];
    
    // Créer les nouveaux points et triangles
    window.appData.participants.forEach(participant => {
        const [lat, long] = participant.coordinates;
        const position = latLongToVector3(lat, long, 2);
        
        // Créer un point pour le participant
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        
        // Vérifier si le participant est l'utilisateur
        const isUser = window.appData.userProfile && participant.id === window.appData.userProfile.id;
        
        // Couleur différente pour l'utilisateur
        const material = new THREE.MeshBasicMaterial({
            color: isUser ? 0xFF5722 : 0xCCCCCC,
            transparent: true,
            opacity: 0.8
        });
        
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position);
        scene.add(point);
        
        // Ajouter un halo lumineux autour du point
        const glowGeometry = new THREE.SphereGeometry(0.03, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: isUser ? 0xFF5722 : 0xCCCCCC,
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(position);
        scene.add(glow);
        
        window.spaceViewState.participants.push(point, glow);
        
        // Stocker l'ID du participant pour retrouver sa position plus tard
        point.userData = { participantId: participant.id };
    });
    
    // Créer les triangles
    window.appData.triangles.forEach(triangle => {
        const triangleColor = new THREE.Color(triangle.color);
        
        // Créer des lignes entre les membres du triangle
        for (let i = 0; i < triangle.members.length; i++) {
            const member1 = triangle.members[i];
            const member2 = triangle.members[(i + 1) % triangle.members.length];
            
            const [lat1, long1] = member1.coordinates;
            const [lat2, long2] = member2.coordinates;
            
            const position1 = latLongToVector3(lat1, long1, 2);
            const position2 = latLongToVector3(lat2, long2, 2);
            
            // Créer une courbe pour la ligne
            const points = [];
            points.push(position1);
            
            // Point intermédiaire pour créer une courbe
            const mid = new THREE.Vector3().addVectors(position1, position2).multiplyScalar(0.5);
            // Déplacer le point intermédiaire vers l'extérieur
            mid.normalize().multiplyScalar(2.2);
            points.push(mid);
            
            points.push(position2);
            
            const curve = new THREE.QuadraticBezierCurve3(position1, mid, position2);
            const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
            
            const material = new THREE.LineBasicMaterial({
                color: triangleColor,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            });
            
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            window.spaceViewState.triangleLines.push(line);
            
            // Ajouter des particules lumineuses le long de la ligne
            addParticlesAlongLine(curve, triangleColor);
        }
    });
    
    // Créer une ligne pour les participants en attente (s'il y en a 2)
    const waitingParticipants = window.appData.participants.filter(p => {
        return !window.appData.triangles.some(t => 
            t.members.some(m => m.id === p.id)
        );
    });
    
    if (waitingParticipants.length === 2) {
        const member1 = waitingParticipants[0];
        const member2 = waitingParticipants[1];
        
        const [lat1, long1] = member1.coordinates;
        const [lat2, long2] = member2.coordinates;
        
        const position1 = latLongToVector3(lat1, long1, 2);
        const position2 = latLongToVector3(lat2, long2, 2);
        
        // Créer une courbe pour la ligne
        const points = [];
        points.push(position1);
        
        // Point intermédiaire
        const mid = new THREE.Vector3().addVectors(position1, position2).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(2.2);
        points.push(mid);
        
        points.push(position2);
        
        const curve = new THREE.QuadraticBezierCurve3(position1, mid, position2);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
        
        // Ligne en pointillés pour les participants en attente
        const dashSize = 0.1;
        const gapSize = 0.1;
        const material = new THREE.LineDashedMaterial({
            color: 0x999999,
            dashSize: dashSize,
            gapSize: gapSize,
            transparent: true,
            opacity: 0.4
        });
        
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances(); // Nécessaire pour les lignes en pointillés
        scene.add(line);
        window.spaceViewState.triangleLines.push(line);
    }
}

// Ajouter des particules lumineuses le long d'une ligne courbe
function addParticlesAlongLine(curve, color) {
    const scene = window.spaceViewState.scene;
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const position = curve.getPoint(t);
        
        const particleGeometry = new THREE.SphereGeometry(0.01, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: Math.random() * 0.5 + 0.5
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        
        // Animation data
        particle.userData = {
            speed: Math.random() * 0.01 + 0.003,
            curve: curve,
            t: t
        };
        
        scene.add(particle);
        window.spaceViewState.triangleLines.push(particle);
    }
}

// Animer les particules le long des lignes
function animateParticles() {
    window.spaceViewState.triangleLines.forEach(object => {
        // Vérifier si c'est une particule avec des données d'animation
        if (object.userData && object.userData.curve) {
            object.userData.t += object.userData.speed;
            if (object.userData.t > 1) object.userData.t = 0;
            
            const position = object.userData.curve.getPoint(object.userData.t);
            object.position.copy(position);
        }
    });
}

// Fonction d'animation pour la vue 3D
function animate() {
    if (!window.spaceViewState.isActive) return;
    
    window.spaceViewState.animationId = requestAnimationFrame(animate);
    
    // Faire tourner doucement la Terre
    if (window.spaceViewState.earth) {
        window.spaceViewState.earth.rotation.y += 0.0005;
    }
    
    // Animer les particules
    animateParticles();
    
    // Mettre à jour les contrôles
    if (window.spaceViewState.controls) {
        window.spaceViewState.controls.update();
    }
    
    // Rendre la scène
    window.spaceViewState.renderer.render(window.spaceViewState.scene, window.spaceViewState.camera);
}

// Basculer entre la vue 2D (carte) et la vue 3D (espace)
function toggleSpaceView() {
    const mapEl = document.getElementById('map');
    const spaceViewEl = document.getElementById('space-view');
    const button = document.getElementById('space-view-toggle');
    const buttonText = document.getElementById('space-view-text');
    
    if (!window.spaceViewState.isActive) {
        // Passer à la vue 3D
        mapEl.classList.add('hidden');
        spaceViewEl.classList.remove('hidden');
        
        // Initialiser la vue 3D si ce n'est pas déjà fait
        if (!window.spaceViewState.scene) {
            initSpaceView();
        }
        
        // Mettre à jour les triangles 3D
        createMeditationTriangles3D();
        
        // Démarrer l'animation
        window.spaceViewState.isActive = true;
        animate();
        
        // Mettre à jour le texte du bouton
        buttonText.textContent = getText('viewMap');
        button.classList.add('bg-indigo-700');
        button.classList.remove('bg-primary');
    } else {
        // Revenir à la vue 2D
        mapEl.classList.remove('hidden');
        spaceViewEl.classList.add('hidden');
        
        // Arrêter l'animation
        window.spaceViewState.isActive = false;
        if (window.spaceViewState.animationId) {
            cancelAnimationFrame(window.spaceViewState.animationId);
        }
        
        // Mettre à jour le texte du bouton
        buttonText.textContent = getText('viewFromSpace');
        button.classList.remove('bg-indigo-700');
        button.classList.add('bg-primary');
    }
}

// Mettre à jour les triangles 3D lorsque les triangles 2D sont mis à jour
// Hook pour la fonction existante updateTriangles
const originalUpdateTriangles = window.updateTriangles || function(){};
window.updateTriangles = function() {
    // Appeler la fonction originale
    originalUpdateTriangles.apply(this, arguments);
    
    // Mettre à jour la vue 3D si elle est active
    if (window.spaceViewState && window.spaceViewState.isActive) {
        createMeditationTriangles3D();
    }
};

// Ajouter le hook pour updateLanguage
const originalUpdateLanguage = window.updateLanguage || function(){};
window.updateLanguage = function(lang) {
    // Appeler la fonction originale
    originalUpdateLanguage.apply(this, arguments);
    
    // Mettre à jour le texte du bouton de la vue spatiale
    const spaceViewToggleText = document.getElementById('space-view-text');
    if (spaceViewToggleText) {
        const key = window.spaceViewState && window.spaceViewState.isActive ? 'viewMap' : 'viewFromSpace';
        spaceViewToggleText.textContent = getText(key);
    }
};

// Initialiser le bouton quand le document est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Créer conteneur pour la vue spatiale s'il n'existe pas déjà
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        if (!document.getElementById('space-view')) {
            const spaceView = document.createElement('div');
            spaceView.id = 'space-view';
            spaceView.className = 'w-full h-full absolute top-0 left-0 hidden';
            mapContainer.appendChild(spaceView);
        }
    }
    
    // Vérifier si le bouton existe déjà, sinon le créer
    if (!document.getElementById('space-view-toggle')) {
        const controlsContainer = document.getElementById('simulation-button').parentNode;
        
        // Si le bouton de simulation n'est pas dans un conteneur flex, on le place dans un
        if (!controlsContainer.classList.contains('flex')) {
            const simulationButton = document.getElementById('simulation-button');
            const parent = simulationButton.parentNode;
            
            // Créer le nouveau conteneur flex
            const flexContainer = document.createElement('div');
            flexContainer.className = 'flex space-x-2';
            
            // Déplacer le bouton de simulation dans ce conteneur
            parent.removeChild(simulationButton);
            flexContainer.appendChild(simulationButton);
            
            // Ajouter le conteneur flex à la place de l'ancien bouton
            parent.appendChild(flexContainer);
            
            // Mettre à jour la référence du conteneur
            controlsContainer = flexContainer;
        }
        
        // Création du bouton de vue spatiale
        const spaceButton = document.createElement('button');
        spaceButton.id = 'space-view-toggle';
        spaceButton.className = 'bg-primary hover:bg-opacity-90 text-white px-3 py-1 rounded text-sm flex items-center';
        spaceButton.innerHTML = `
            <svg class="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20"></path>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span id="space-view-text">${getText('viewFromSpace')}</span>
        `;
        
        // Insérer le bouton avant le bouton de simulation
        controlsContainer.insertBefore(spaceButton, document.getElementById('simulation-button'));
        
        // Ajouter l'événement au bouton
        spaceButton.addEventListener('click', toggleSpaceView);
    }
});
