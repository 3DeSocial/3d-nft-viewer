 class Viewer {
    constructor(parentDivEl) {

        //First lets create a parent DIV
        this.parentDivEl = parentDivEl;

        let parentDivElWidth = this.parentDivEl.children[0].offsetWidth;
        let parentDivElHeight = this.parentDivEl.children[0].offsetHeight;

        this.parentDivEl.children[0].setAttribute('style','display:none;');
        //Lets create a new Scene
        this.scene = new THREE.Scene();

        //Create a camera
        this.camera = new THREE.PerspectiveCamera(60, parentDivElWidth/parentDivElHeight, 0.01, 1000 );
        //Only gotcha. Set a non zero vector3 as the camera position.
        this.camera.position.set(0,0,0.1);

        //Create a WebGLRenderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(parentDivElWidth, parentDivElHeight);
        this.parentDivEl.appendChild(this.renderer.domElement);

        //Loader GLTF
        this.gltfLoader = new THREE.GLTFLoader();

        //Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);


        //Add lights
        const ambientLight = new THREE.Light(0xffffff, 1);
        this.scene.add(ambientLight);

        //Add dirlights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-4,15,10);
        this.scene.add(directionalLight);

        this.onWindowResize();

        this.animate();

    }

    onWindowResize() {


        window.addEventListener('resize', () => {
        let parentDivElWidth = this.parentDivEl.children[0].offsetWidth;
        let parentDivElHeight = this.parentDivEl.children[0].offsetHeight;
            this.camera.aspect = parentDivElWidth/parentDivElHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(parentDivElWidth, parentDivElHeight);

        })

    }

    animate() {

        requestAnimationFrame(this.animate.bind(this));

        this.renderer.render(this.scene, this.camera);

    }

    createParentDivEl() {
        let parentDivEl = document.createElement('div');
        parentDivEl.id = "viewer3d";
        parentDivEl.classList.add('viewer');
        document.body.appendChild(parentDivEl);
        return parentDivEl;
    }

     fitCameraToMesh(mesh, fitOffset = 1.2) {

        const box = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * this.camera.fov / 360));
        const fitWidthDistance = fitHeightDistance / this.camera.aspect;
        const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

        const direction = this.controls.target.clone()
            .sub(this.camera.position)
            .normalize()
            .multiplyScalar(distance);

        this.controls.maxDistance = distance * 10;
        this.controls.target.copy(center);

        this.camera.near = distance / 100;
        this.camera.far = distance * 100;
        this.camera.updateProjectionMatrix();

        this.camera.position.copy(this.controls.target).sub(direction);
        this.controls.update();
    }

    load(modeURL) {
        //TODO: Load's external files

        this.gltfLoader.load(modeURL, (model)=> {

            model.scene.updateMatrixWorld(true);

            this.fitCameraToMesh(model.scene);

            this.scene.add(model.scene);
        })


    }
}

 (function() { 

	var container;

	var camera, controls, scene, renderer;

	var cameraFov = 60;

 	updateUI = (el, modelUrl) => {
		//console.log('showing button for '+modelUrl);
		var a = document.createElement('a');
      	var linkText = document.createTextNode("Click to View in 3D");
			a.appendChild(linkText);
			a.title = "View in 3D";
			a.href = "#";
		var viewerEl = el;
			viewerEl.innerHTML ='';
			viewerEl.appendChild(a);

		return a;			
 	}

 	addClickListener = (el, modelUrl) => {
		//console.log('adding listener for '+modelUrl);
		el.addEventListener("click", (e)=>{
			e.preventDefault();
			e.stopPropagation();
			console.log('init three for: '+modelUrl);
			//initThree(modelUrl);
			let container = document.getElementById( 'container' );
  			let appInstance = new Viewer(container);
    			appInstance.load(modelUrl);			
		});		
 	}
	
 	initModel = (el) => {
 		const that = this;

 		let nftPostHash = el.getAttribute('data-nft');
 		console.log('nftPostHash:' +nftPostHash);
 		let url = '/nfts/'+nftPostHash;
 		fetch(url)
 		.then(response => response.json())
 		.then((data)=>{	

 			if(data !== undefined){
 				let fullUrl = '/models/'+nftPostHash+data.modelUrl;
 				let link = this.updateUI(el, fullUrl);
 				this.addClickListener(link, fullUrl);
 			};

 		}).catch(err => alert(err));

 	} 	

 	let nfts = Array.from(document.getElementsByClassName('nft-viewer'));

 	nfts.forEach(this.initModel);


 })(this);