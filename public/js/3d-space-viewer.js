export const name = 'd3d-space-viewer';
let THREE;

let renderer, camera, scene, clock, gui, stats, delta;
let environment, collider, visualizer, player, controls, geometries;
let playerIsOnGround = false;
let fwdPressed = false, bkdPressed = false, lftPressed = false, rgtPressed = false;

import * as BufferGeometryUtils from 'https://unpkg.com/three@0.139.1/examples/jsm/utils/BufferGeometryUtils.js';

import { OrbitControls } from 'https://unpkg.com/three@0.139.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.139.1/examples/jsm/loaders/GLTFLoader.js';
import { XRControllerModelFactory } from '/js/webxr/XRControllerModelFactory.js';
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.139.1/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MeshBVH, acceleratedRaycast, MeshBVHVisualizer } from '/js/index.module.js';
import { LayoutBuilder } from '/js/DSO_LayoutBuilder.js'
import { D3DInventory } from '/js/D3D_Inventory.js'
import { VRButton } from '/js/DSO_VRButton.js';

const params = {

    firstPerson: true,

    displayCollider: false,
    displayBVH: false,
    visualizeDepth: 10,
    gravity: - 30,
    playerSpeed: 10,
    physicsSteps: 5

};

 class D3DSpaceViewer {
    
    constructor(config) {

        let defaults = {
                    el: document.body,
                    ctrClass: 'data-nft', // Attribute of div containing nft preview area for a single nft
                    nftsRoute: 'nfts', // Back end route to initialize NFTs
                    modelsRoute: 'models'// Back end route to load models
                };
        
        this.config = {
            ...defaults,
            ...config
        };
        THREE = this.config.three;


        this.playerVelocity = new THREE.Vector3();
        this.upVector = new THREE.Vector3( 0, 1, 0 );
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
        this.tempBox = new THREE.Box3();
        this.tempMat = new THREE.Matrix4();
        this.tempSegment = new THREE.Line3();
        this.isFullScreen = false;
        this.floorPlane = null;
        this.cameraVector = new THREE.Vector3();
        this.dolly = null,
        this.prevGamePads = new Map(),
        this.speedFactor = [0.1, 0.1, 0.1, 0.1],
        this.controllers = []
        this.layoutBuilder = new LayoutBuilder({items:[{width: 0.5, height:0.5, depth:0.5},{width: 0.5, height:0.5, depth:0.5},{width: 0.5, height:0.5, depth:0.5},{width: 0.5, height:0.5, depth:0.5},{width: 0.5, height:0.5, depth:0.5}]}); // use default test items
        this.dimensions = this.layoutBuilder.dimensions;

       /*  this.initSpace({
                el: "collection-wrapper",
                items: []
            });
*/
        this.fetchCollection().then((nfts)=>{
            this.initSpace({
                el: "collection-wrapper",
                items: nfts
            });
        })
    }

    reset = ()=> {
console.log('player reset');
        this.playerVelocity.set( 0, 0, 0 );
        this.player.position.set( 0, 5, 5 );
        this.camera.position.sub( this.controls.target );
        this.controls.target.copy( this.player.position );
        this.camera.position.add( this.player.position );
        this.controls.update();

    }
    fetchCollection = () =>{
        return new Promise((resolve, reject) => {
            let postData = {userName:'3DeSocial'};

            const options = {
                method: 'POST',
                body: JSON.stringify(postData),
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            fetch('collection/fetch',options)
                .then(response => response.json())
                .then((data)=>{ 
                    console.log('nfts recieved');
                    console.log(data);
                    resolve(data.nfts);
                });

        });

    }

    initSpace(opts){

        this.config = {
            ...this.config,
            ...opts
        };

        //First lets create a parent DIV
        this.parentDivEl = document.getElementById(opts.el);
        if(!this.parentDivEl){
            throw('No parent element passed');
            return false;
        };
        this.parentDivElWidth = this.parentDivEl.offsetWidth;
        this.parentDivElHeight = this.parentDivEl.offsetHeight;

        //Lets create a new Scene
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        this.initSkybox();
        this.initRenderer();
        this.initLoaders(); 
        this.loadColliderEnvironment();
        this.initInventory();
       // this.renderLayout();
       // this.renderItems();
        this.initCamera();        
        this.initLighting();
        this.initControls();
        this.initPlayer();
        this.initVR();
        this.addListeners();
        this.animate();


    }

    initPlayer = () => {
        // character
        this.player = new THREE.Mesh(
            new RoundedBoxGeometry( 1.0, 2.0, 1.0, 10, 0.5 ),
            new THREE.MeshStandardMaterial()
        );
        this.player.geometry.translate( 0, - 0.5, 0 );
        this.player.capsuleInfo = {
            radius: 0.5,
            segment: new THREE.Line3( new THREE.Vector3(), new THREE.Vector3( 0, - 1.0, 0.0 ) )
        };
        this.player.castShadow = true;
        this.player.receiveShadow = true;
        this.player.material.shadowSide = 2;
        this.scene.add( this.player );        
        this.reset();
    }

    updatePlayer = (delta) =>{

        this.playerVelocity.y += this.playerIsOnGround ? 0 : delta * params.gravity;
        this.player.position.addScaledVector( this.playerVelocity, delta );

        // move the this.player
        const angle = this.controls.getAzimuthalAngle();
        if ( fwdPressed ) {

            this.tempVector.set( 0, 0, - 1 ).applyAxisAngle( this.upVector, angle );
            this.player.position.addScaledVector( this.tempVector, params.playerSpeed * delta );
            fwdPressed = false;
        }

        if ( bkdPressed ) {

            this.tempVector.set( 0, 0, 1 ).applyAxisAngle( this.upVector, angle );
            this.player.position.addScaledVector( this.tempVector, params.playerSpeed * delta );
bkdPressed = false;
        }

        if ( lftPressed ) {

            this.tempVector.set( - 1, 0, 0 ).applyAxisAngle( this.upVector, angle );
            this.player.position.addScaledVector( this.tempVector, params.playerSpeed * delta );
lftPressed = false;
        }

        if ( rgtPressed ) {

            this.tempVector.set( 1, 0, 0 ).applyAxisAngle( this.upVector, angle );
            this.player.position.addScaledVector( this.tempVector, params.playerSpeed * delta );
rgtPressed = false;
        }

        this.player.updateMatrixWorld();

        // adjust this.player position based on collisions
        const capsuleInfo = this.player.capsuleInfo;
        this.tempBox.makeEmpty();
        this.tempMat.copy( collider.matrixWorld ).invert();
        this.tempSegment.copy( capsuleInfo.segment );

        // get the position of the capsule in the local space of the collider
        this.tempSegment.start.applyMatrix4( this.player.matrixWorld ).applyMatrix4( this.tempMat );
        this.tempSegment.end.applyMatrix4( this.player.matrixWorld ).applyMatrix4( this.tempMat );

        // get the axis aligned bounding box of the capsule
        this.tempBox.expandByPoint( this.tempSegment.start );
        this.tempBox.expandByPoint( this.tempSegment.end );

        this.tempBox.min.addScalar( - capsuleInfo.radius );
        this.tempBox.max.addScalar( capsuleInfo.radius );

        collider.geometry.boundsTree.shapecast( {

            intersectsBounds: box => box.intersectsBox( this.tempBox ),

            intersectsTriangle: tri => {

                // check if the triangle is intersecting the capsule and adjust the
                // capsule position if it is.
                const triPoint = this.tempVector;
                const capsulePoint = this.tempVector2;

                const distance = tri.closestPointToSegment( this.tempSegment, triPoint, capsulePoint );
                if ( distance < capsuleInfo.radius ) {

                    const depth = capsuleInfo.radius - distance;
                    const direction = capsulePoint.sub( triPoint ).normalize();

                    this.tempSegment.start.addScaledVector( direction, depth );
                    this.tempSegment.end.addScaledVector( direction, depth );

                }

            }

        } );

        // get the adjusted position of the capsule collider in world space after checking
        // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
        // the origin of the this.player model.
        const newPosition = this.tempVector;
        newPosition.copy( this.tempSegment.start ).applyMatrix4( collider.matrixWorld );

        // check how much the collider was moved
        const deltaVector = this.tempVector2;
        deltaVector.subVectors( newPosition, this.player.position );

        // if the this.player was primarily adjusted vertically we assume it's on something we should consider ground
        this.playerIsOnGround = deltaVector.y > Math.abs( delta * this.playerVelocity.y * 0.25 );

        const offset = Math.max( 0.0, deltaVector.length() - 1e-5 );
        deltaVector.normalize().multiplyScalar( offset );

        // adjust the this.player model
        this.player.position.add( deltaVector );

        if ( ! this.playerIsOnGround ) {

            deltaVector.normalize();
            this.playerVelocity.addScaledVector( deltaVector, - deltaVector.dot( this.playerVelocity ) );

        } else {

            this.playerVelocity.set( 0, 0, 0 );

        }

        // adjust the this.camera
        this.camera.position.sub( this.controls.target );
        this.controls.target.copy( this.player.position );
        this.camera.position.add( this.player.position );

        // if the this.player has fallen too far below the level reset their position to the start
        if ( this.player.position.y < - 25 ) {

            this.reset();

        }

    } 

    initInventory = () =>{
        this.inventory = new D3DInventory({ three: THREE,
                                            items: this.config.items,
                                            scene: this.scene,
                                            gltfLoader: this.gltfLoader});
    }

    initCamera = () =>{
        //Create a camera
        this.camera = new THREE.PerspectiveCamera(60, this.parentDivElWidth/this.parentDivElHeight, 0.01, 1000 );
        //Only gotcha. Set a non zero vector3 as the camera position.
        this.camera.position.set( 10, 10, - 10);
        this.camera.far = 100;
        this.camera.updateProjectionMatrix();

    }

    initControls = () =>{
        //Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        //this.controls.addEventListener('change', this.render);
        //this.controls.update();        
    }

    initRenderer = () =>{
        //Create a WebGLRenderer
        this.renderer = new THREE.WebGLRenderer({antialias: true,
                alpha: true,
                preserveDrawingBuffer: true});

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        this.renderer.xr.enabled = true;
        //the following increases the resolution on Quest
        this.renderer.xr.setFramebufferScaleFactor(2.0);

        this.renderer.setSize(this.parentDivElWidth, this.parentDivElHeight);
        this.renderer.setClearColor( 0x000000, 1 );
        //this.renderer.domElement.setAttribute('style','display:none;');
        this.parentDivEl.appendChild(this.renderer.domElement);

        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';        
    }

    renderLayout = () =>{
        let modelUrl = '/layouts/gallery1/scene.gltf';
        this.loadLayoutModel(modelUrl);
      //  this.addFloor();
      //  this.addLogo();
    }
    loadLayoutModel =(modelURL)=>{
        let that = this;
        that.gltfLoader.load(modelURL, (model)=> {
            let gltfMesh = null;
            gltfMesh = model.scene;
            gltfMesh.scale.set(0.25,0.25,0.25);
            gltfMesh.position.set(0,0,0);        
            that.scene.add(gltfMesh);
        })
    }

    loadColliderEnvironment =() =>{

        this.gltfLoader.load( '/layouts/amphitheater/scene.gltf', res => {

            const gltfScene = res.scene;
         //   gltfScene.scale.setScalar( .01 );

            const box = new THREE.Box3();
            box.setFromObject( gltfScene );
            box.getCenter( gltfScene.position ).negate();
            gltfScene.updateMatrixWorld( true );

            // visual geometry setup
            const toMerge = {};
            gltfScene.traverse( c => {

                if ( c.isMesh ) {
                    console.log('mesh found');
                    const hex = c.material.color.getHex();
                    toMerge[ hex ] = toMerge[ hex ] || [];
                    toMerge[ hex ].push( c );

                }

            } );

            environment = new THREE.Group();
            for ( const hex in toMerge ) {

                const arr = toMerge[ hex ];
                const visualGeometries = [];
                arr.forEach( mesh => {

                    if ( mesh.material.emissive.r !== 0 ) {

                        environment.attach( mesh );

                    } else {

                        const geom = mesh.geometry.clone();
                        geom.applyMatrix4( mesh.matrixWorld );
                        visualGeometries.push( geom );

                    }

                } );

                if ( visualGeometries.length ) {

                    const newGeom = BufferGeometryUtils.mergeBufferGeometries( visualGeometries );
                    const newMesh = new THREE.Mesh( newGeom, new THREE.MeshStandardMaterial( { color: parseInt( hex ), shadowSide: 2 } ) );
                    newMesh.castShadow = true;
                    newMesh.receiveShadow = true;
                    newMesh.material.shadowSide = 2;

                    environment.add( newMesh );

                }

            }

            // collect all geometries to merge
            const geometries = [];

            environment.updateMatrixWorld( true );
            environment.traverse( c => {

                if ( c.geometry ) {

                    const cloned = c.geometry.clone();
                    cloned.applyMatrix4( c.matrixWorld );
                    for ( const key in cloned.attributes ) {

                        if ( key !== 'position' ) {

                            cloned.deleteAttribute( key );

                        }

                    }

                    geometries.push( cloned );

                }

            } );

            // create the merged geometry
            console.log('geometries');

            console.log(geometries);
            const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries( geometries, false );
            mergedGeometry.boundsTree = new MeshBVH( mergedGeometry, { lazyGeneration: false } );

            collider = new THREE.Mesh( mergedGeometry );
            collider.material.wireframe = false;
            collider.material.opacity = 0;
            collider.material.transparent = true;

            visualizer = new MeshBVHVisualizer( collider, params.visualizeDepth );
            collider.position.set(0,0,0);    
         //   this.scene.add( visualizer );
            this.scene.add( collider );
            //environment.position.set(0,0,0);    
            //this.scene.add( environment );
           gltfScene.position.set(0,-11.5,0)
            this.scene.add(gltfScene);
console.log('added environment');
        } );

    }

    renderItems = () =>{

        let width = this.dimensions.width;
        let depth = this.dimensions.depth;
        let xpos = 0;
        let zpos = 0;
        let ypos = -11.5;
        let items = this.inventory.getItems();
        let areaOffset = width / 2; //0,0,0 is center so start positioning from negative offset of half area width
        items.forEach((item, idx)=>{
            if(idx>0){
                let xOffset = (this.dimensions.width / 2) -2;
           // let itemHeightOffset = item.height/2;

     /*      let itemWidthOffset = item.width/2;
            console.log('itemWidthOffset: ',itemWidthOffset);

            console.log('itemHeightOffset: ',itemHeightOffset);

      //      if(idx===0){
                item.config.color = 0xFF0000;
       //     };
//
            if(xpos === width){
                xpos = 0;
                zpos++;
            };

            if((xpos<width)&&(zpos<depth)){
                console.log('positioning..');
                console.log(xpos,ypos,zpos);
*/
console.log('positioning..');
                console.log(xpos,ypos,zpos);
                let newPos = new THREE.Vector3(xpos - xOffset,ypos,0);
                xpos = xpos+4;
                //                console.log(newPos);
             //  let newPos = new THREE.Vector3(0,itemHeightOffset,0);
                item.place(newPos);
            }
        });
        

    }

    initSkybox = ()=>{
        if(this.config.skyboxes !== false){
            let skyBoxList = ['blue','bluecloud','browncloud','lightblue','yellowcloud'];
            let skyBoxNo = this.getRandomInt(0,4);
            let skyBox = this.loadSkyBox(skyBoxList[skyBoxNo]);
            this.scene.background = skyBox;
        };
    }

    initLighting = () =>{
        //Add lights
        this.hlight = new THREE.AmbientLight(0xffFFBB, 0.2);
        this.scene.add(this.hlight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        console.log('light added');
    }

    initLoaders = () =>{
        //Loader GLTF
        this.gltfLoader = new GLTFLoader();        
    }

    addListeners = ()=>{
        let that = this;
       // this.addEventListenerResize();
      // this.addEventListenerExitFullScreen();

        window.addEventListener( 'keydown', function ( e ) {

                switch ( e.code ) {

                    case 'KeyW': fwdPressed = true; break;
                    case 'KeyS': bkdPressed = true; break;
                    case 'KeyD': rgtPressed = true; break;
                    case 'KeyA': lftPressed = true; break;
                    case 'Space':
                        if ( that.playerIsOnGround ) {

                            that.playerVelocity.y = 10.0;

                        }

                        break;

                }

            } );

            window.addEventListener( 'keyup', function ( e ) {

                switch ( e.code ) {

                    case 'KeyW': fwdPressed = false; break;
                    case 'KeyS': bkdPressed = false; break;
                    case 'KeyD': rgtPressed = false; break;
                    case 'KeyA': lftPressed = false; break;

                }

            } );

    }

    showOverlay =()=>{

        let that = this;
        let overlay = new D3DNFTViewerOverlay({
            el: this.parentDivEl,
            handlers: {
                floor: (checked)=>{
                    if(checked){
                        that.addFloor();
                    } else {
                        that.removeFloor();
                    }
                }
            }
        })        
    }

    getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    loadSkyBox(boxname){

        let skybox ='';

        const loader = new THREE.CubeTextureLoader();
              loader.setPath( '/images/skyboxes/'+boxname+'/' );

        switch(boxname){
            case 'bluecloud':
                skybox = loader.load([
                            'bluecloud_ft.jpg',
                            'bluecloud_bk.jpg',
                            'bluecloud_up.jpg',
                            'bluecloud_dn.jpg',
                            'bluecloud_rt.jpg',
                            'bluecloud_lf.jpg']);
            break;
            case 'yellowcloud':
                skybox = loader.load([
                            'yellowcloud_ft.jpg',
                            'yellowcloud_bk.jpg',
                            'yellowcloud_up.jpg',
                            'yellowcloud_dn.jpg',
                            'yellowcloud_rt.jpg',
                            'yellowcloud_lf.jpg']);
            break;
            case 'browncloud':
                skybox = loader.load([
                            'browncloud_ft.jpg',
                            'browncloud_bk.jpg',
                            'browncloud_up.jpg',
                            'browncloud_dn.jpg',
                            'browncloud_rt.jpg',
                            'browncloud_lf.jpg']);
            break;
            case 'lightblue':
                skybox = loader.load([
                            'right.png',
                            'left.png',
                            'top.png',
                            'bot.png',
                            'front.png',
                            'back.png']);
            break;             
            case 'blue':
                skybox = loader.load([
                            'bkg1_right.png',
                            'bkg1_left.png',
                            'bkg1_top.png',
                            'bkg1_bot.png',
                            'bkg1_front.png',
                            'bkg1_back.png']);
            break;
        }
        
        return skybox;
    }

    addEventListenerResize = () =>{

        window.addEventListener('resize', this.resize.bind(this), false);
    }

    addEventListenerExitFullScreen = () =>{
        if (document.addEventListener){
            document.addEventListener('webkitfullscreenchange', this.fsChangeHandler, false);
            document.addEventListener('mozfullscreenchange', this.fsChangeHandler, false);
            document.addEventListener('fullscreenchange', this.fsChangeHandler, false);
            document.addEventListener('MSFullscreenChange', this.fsChangeHandler, false);
        }
    }

    fsChangeHandler = () =>{
            if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement !== undefined) {
            console.log('enter full screen');
        } else {
            console.log('exit full screen');
          var elem = this.renderer.domElement;
            elem.style.width = 'auto';
            elem.style.height = 'auto';
            this.isFullScreen = false;            
            this.camera.aspect = this.parentDivElWidth/this.parentDivElHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.parentDivElWidth, this.parentDivElHeight);
        }
    
    }

    resize = () =>{
        if (!this.renderer.xr.isPresenting) {
            this.camera.aspect = this.containerWidth / this.containerHeight;
            this.camera.updateProjectionMatrix();
        } else {
           // this.resizeCanvas();
        };
    }
    resizeCanvas = () =>{
        this.isFullScreen = true;
        if(this.isFullScreen){
            let canvasWidth = screen.width;
            let canvasHeight = screen.height;
            this.camera.aspect = canvasWidth/canvasHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(canvasWidth,canvasHeight);
        } else {
            this.camera.aspect = this.parentDivElWidth/this.parentDivElHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.parentDivElWidth, this.parentDivElHeight);
        }
        this.fitCameraToMesh(this.scene);        
    }

        isIterable = (obj) =>{
            // checks for null and undefined
            if (obj == null) {
                return false;
            }
            return typeof obj[Symbol.iterator] === 'function';
        }
        
        animate = () =>{
            this.renderer.setAnimationLoop(this.render);
        }
        
        render = () =>{
            if (this.renderer.xr.isPresenting === true) {
                this.dollyMove();
            }

            const delta = Math.min( this.clock.getDelta(), 0.1 );
            if ( params.firstPerson ) {

                this.controls.maxPolarAngle = Math.PI;
                this.controls.minDistance = 1e-4;
                this.controls.maxDistance = 1e-4;

            } else {

                this.controls.maxPolarAngle = Math.PI / 2;
                this.controls.minDistance = 1;
                this.controls.maxDistance = 20;

            }

              if ( collider ) {

                collider.visible = params.displayCollider;
                visualizer.visible = params.displayBVH;

                const physicsSteps = params.physicsSteps;

                for ( let i = 0; i < physicsSteps; i ++ ) {

                    this.updatePlayer( delta / physicsSteps );

                }

            }

            // TODO: limit the camera movement based on the collider
            // raycast in direction of camera and move it if it's further than the closest point

            this.controls.update();

            this.renderer.render(this.scene, this.camera);
        }

        dollyMove = () =>{
            var handedness = 'unknown';
            var self = this;
            //determine if we are in an xr session
            const session = this.renderer.xr.getSession();

            if (session) {
                var i = 0;
                let xrCamera = this.renderer.xr.getCamera(this.camera);
                if (!xrCamera) {
                    return;
                }
                xrCamera.getWorldDirection(self.cameraVector);

                //a check to prevent console errors if only one input source
                if (this.isIterable(session.inputSources)) {
                    for (const source of session.inputSources) {
                        if (source && source.handedness) {
                            handedness = source.handedness; //left or right controllers
                        }
                        if (!source.gamepad) continue;
                        const controller = this.renderer.xr.getController(i++);
                        const old = this.prevGamePads.get(source);
                        const data = {
                            handedness: handedness,
                            buttons: source.gamepad.buttons.map((b) => b.value),
                            axes: source.gamepad.axes.slice(0)
                        };

                        if (old) {
                            data.buttons.forEach((value, i) => {
                                //handlers for buttons
                                if (value !== old.buttons[i] || Math.abs(value) > 0.8) {
                                    //check if it is 'all the way pushed'
                                    if (value === 1) {
                                        //console.log("Button" + i + "Down");
                                        if (data.handedness == 'left') {
                                            //console.log("Left Paddle Down");
                                            if (i == 1) {
                                                self.dolly.rotateY(-THREE.Math.degToRad(1));
                                            }
                                            if (i == 3) {
                                                //reset teleport to home position
                                                self.dolly.position.x = 0;
                                                self.dolly.position.y = 5;
                                                self.dolly.position.z = 0;
                                            }
                                        } else {
                                            //console.log("Right Paddle Down");
                                            if (i == 1) {
                                                self.dolly.rotateY(THREE.Math.degToRad(1));
                                            }
                                        }
                                    } else {
                                        // console.log("Button" + i + "Up");

                                        if (i == 1) {
                                            //use the paddle buttons to rotate
                                            if (data.handedness == 'left') {
                                                //console.log("Left Paddle Down");
                                                self.dolly.rotateY(
                                                    -THREE.Math.degToRad(Math.abs(value))
                                                );
                                            } else {
                                                //console.log("Right Paddle Down");
                                                self.dolly.rotateY(
                                                    THREE.Math.degToRad(Math.abs(value))
                                                );
                                            }
                                        }
                                    }
                                }
                            });

                            data.axes.forEach((value, i) => {
                                //handlers for thumbsticks
                                // console.log('axes: ',i);
                                //if thumbstick axis has moved beyond the minimum threshold from center, windows mixed reality seems to wander up to about .17 with no input
                                if (Math.abs(value) > 0.1) {
                                    //set the speedFactor per axis, with acceleration when holding above threshold, up to a max speed
                                    self.speedFactor[i] > 1
                                        ? (self.speedFactor[i] = 1)
                                        : (self.speedFactor[i] *= 1.001);
                                    //  console.log(value, self.speedFactor[i], i);
                                    if (i == 2) {
                                        //   console.log('data.handedness: '+data.handedness);
                                        //left and right axis on thumbsticks
                                        if (data.handedness == 'left') {
                                            if (data.axes[2] > 0) {
                                                 console.log('left on left thumbstick: MOVE RIGHT');
                                                 rgtPressed = true;
                                                 lftPressed = false;
                                            } else if (data.axes[2] <= 0) {
                                                console.log('right on left thumbstick: MOVE LEFT');
                                                 lftPressed = true;
                                                 rgtPressed = false;
                                            } else {
                                                 lftPressed = false;
                                                 rgtPressed = false;
                                            };

                                            //move our dolly
                                            //we reverse the vectors 90degrees so we can do straffing side to side movement
                                           /* self.dolly.position.x -=
                                                self.cameraVector.z *
                                                self.speedFactor[i] *
                                                data.axes[2];

                                            self.dolly.position.z +=
                                                self.cameraVector.x *
                                                self.speedFactor[i] *
                                                data.axes[2];
                                                */

                                            //provide haptic feedback if available in browser
                                            /*  if (
                                        source.gamepad.hapticActuators &&
                                        source.gamepad.hapticActuators[0]
                                    ) {
                                        var pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                                        if (pulseStrength > 0.75) {
                                            pulseStrength = 0.75;
                                        }

                                        var didPulse = source.gamepad.hapticActuators[0].pulse(
                                            pulseStrength,
                                            100
                                        );
                                    }*/
                                        } else {
                                            //    console.log('RH ata.axes[2]: '+data.axes[2]);
                                                (data.axes[2] > 0) ? console.log('left on right thumbstick') : console.log('right on right thumbstick'); // !!!THIS WORKS!!!
                                            self.dolly.rotateY(-THREE.Math.degToRad(data.axes[2]));
                                        }
                                        // self.controls.update();
                                    }

                                    if (i == 3) {
                                        //up and down axis on thumbsticks
                                        if (data.handedness == 'left') {
                                             (data.axes[3] > 0) ? console.log('up on left thumbstick') : console.log('down on left thumbstick')
                                            self.dolly.position.y -= self.speedFactor[i] * data.axes[3];
                                            //provide haptic feedback if available in browser
                                            /*  if (
                                        source.gamepad.hapticActuators &&
                                        source.gamepad.hapticActuators[0]
                                    ) {
                                        var pulseStrength = Math.abs(data.axes[3]);
                                        if (pulseStrength > 0.75) {
                                            pulseStrength = 0.75;
                                        }
                                        var didPulse = source.gamepad.hapticActuators[0].pulse(
                                            pulseStrength,
                                            100
                                        );
                                    }*/
                                        } else {
                                             (data.axes[3] > 0) ? console.log('up on right thumbstick MOVE BACKWARDS') : console.log('down on right thumbstick:  MOVE FORWARDS')
                                                                                         if (data.axes[3] > 0) {
                                                 console.log('up on right thumbstick MOVE BACKWARDS');
                                                 bkdPressed = true;
                                                 fwdPressed = false;
                                            } else if (data.axes[3] <= 0) {
                                                console.log('down on right thumbstick:  MOVE FORWARDS');
                                                 fwdPressed = true;
                                                 bkdPressed = false;
                                            } else {
                                                 bkdPressed = false;
                                                 fwdPressed = false;
                                            };
                                             // MOVE FORWARDS
                                       /*     self.dolly.position.x -=
                                                self.cameraVector.x *
                                                self.speedFactor[i] *
                                                data.axes[3];
                                            self.dolly.position.z -=
                                                self.cameraVector.z *
                                                self.speedFactor[i] *
                                                data.axes[3];
*/
                                            //provide haptic feedback if available in browser
                                            /*    if (
                                        source.gamepad.hapticActuators &&
                                        source.gamepad.hapticActuators[0]
                                    ) {
                                        var pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                                        if (pulseStrength > 0.75) {
                                            pulseStrength = 0.75;
                                        }
                                        var didPulse = source.gamepad.hapticActuators[0].pulse(
                                            pulseStrength,
                                            100
                                        );
                                    }*/
                                            //self.controls.update();
                                        }
                                    }
                                } else {
                                    //axis below threshold - reset the speedFactor if it is greater than zero  or 0.025 but below our threshold
                                    if (Math.abs(value) > 0.025) {
                                        self.speedFactor[i] = 0.025;
                                    }
                                }
                            });
                        }
                        this.prevGamePads.set(source, data);
                    }
                }
            }
        }

     fitCameraToMesh(mesh, fitOffset = 0.75) {

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

    updateUI = (el, modelUrl) => {

        let linkCtr = this.config.linkCtrCls;
        let linkView3D = this.createLinkView3D();
        this.addClickListener3D(el, linkView3D, modelUrl);

        let linkViewFull = this.createLinkFullScreen()
        this.addClickListenerFullScreen(el, linkViewFull, modelUrl);

        let linkViewVR = this.createLinkVR()
        this.addClickListenerVR(el, linkViewVR, modelUrl)

        var viewerEl = el;
            viewerEl.appendChild(linkView3D);
            viewerEl.appendChild(linkViewFull);
            viewerEl.appendChild(linkViewVR);

        el.setAttribute('model-status','available');
    }

    createLinkView3D = () =>{
        var a = document.createElement('a');
        var linkText = document.createTextNode(this.config.linkText);
            a.appendChild(linkText);
            a.title = "View in 3D";
            a.href = "#";
            a.classList = "btn d3d-btn view-3d-btn";
        return a;
    }

    createLinkFullScreen = () =>{
        var a = document.createElement('a');
        var linkText = document.createTextNode('Full Screen');
            a.appendChild(linkText);
            a.title = "Fullscreen";
            a.href = "#";
            a.classList = "btn d3d-btn view-fullscreen-btn";
            a.setAttribute('style','display:none;');
        return a;
    }    

    createLinkVR = () =>{
        var a = document.createElement('a');
        var linkText = document.createTextNode('View in VR');
            a.appendChild(linkText);
            a.title = "View in VR";
            a.href = "#";
            a.classList = "btn d3d-btn view-vr-btn";
            a.setAttribute('style','display:none;');
        return a;
    }    
    

  openFullscreen =()=> {
      var elem = this.renderer.domElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
      elem.style.width = '100%';
      elem.style.height = '100%';
      this.isFullScreen = true;
    }

    addClickListener3D = (ctr, el, modelUrl) => {
        let that = this;
        let targetEl = this.findElFrom(this.config.previewCtrCls, ctr);

        //console.log('adding listener for '+modelUrl);
        el.addEventListener("click", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            that.updateLink(el,'Loading..');
            that.initContainer(targetEl);
            that.load(modelUrl, function(){
                el.setAttribute('style','display:none;');
                el.parentNode.getElementsByClassName('view-fullscreen-btn')[0].setAttribute('style','display:inline-block;');
                el.parentNode.getElementsByClassName('view-vr-btn')[0].setAttribute('style','display:inline-block;');
                that.addFloor();
                that.showOverlay();
                VRButton.registerSessionGrantedListener();        
                let vrButtonEl = VRButton.createButton(that.renderer);
                that.controllers = that.buildControllers();
                that.animate();

            });         
        });     
    }

        initVR = () =>{
            let vrButtonEl = VRButton.createButton(this.renderer);
            this.controllers = this.buildControllers();      
        }

        buildControllers() {
            // controllers
            let controller1 = this.renderer.xr.getController(0);
            controller1.name = 'left';
            //controller1.addEventListener("selectstart", onSelectStart);
            //controller1.addEventListener("selectend", onSelectEnd);
            this.scene.add(controller1);

            let controller2 = this.renderer.xr.getController(1);
            controller2.name = 'right';
            //controller2.addEventListener("selectstart", onSelectStart);
            //controller2.addEventListener("selectend", onSelectEnd);
            this.scene.add(controller2);

            var controllerModelFactory = new XRControllerModelFactory();

            let controllerGrip1 = this.renderer.xr.getControllerGrip(0);
            controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
            this.scene.add(controllerGrip1);

            let controllerGrip2 = this.renderer.xr.getControllerGrip(1);
            controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
            this.scene.add(controllerGrip2);

            //Raycaster Geometry
            var geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -1)
            ]);

            var line = new THREE.Line(geometry);
            line.name = 'line';
            line.scale.z = 5;

            controller1.add(line.clone());
            controller2.add(line.clone());

            //dolly for camera
            let dolly = new THREE.Group();
            dolly.position.set(0, 0, 0);
            dolly.name = 'dolly';
            this.scene.add(dolly);
            dolly.add(this.camera);
            //add the controls to the dolly also or they will not move with the dolly
            dolly.add(controller1);
            dolly.add(controller2);
            dolly.add(controllerGrip1);
            dolly.add(controllerGrip2);
            this.dolly = dolly;
        }


    addFloor = () =>{
        if(this.floorPlane){
            this.scene.add( this.floorPlane );
            this.floorPlane.position.set(0,0,0);

        } else {
            console.log( this.dimensions.width, this.dimensions.depth);
            const geometry = new THREE.PlaneGeometry( this.dimensions.width, this.dimensions.depth );
            geometry.rotateX(-Math.PI * 0.5);
            let texture = new THREE.TextureLoader().load('images/textures/asphalt.jpg' );
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( this.dimensions.width, this.dimensions.depth );
            const material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, map:texture } );
            this.floorPlane = new THREE.Mesh( geometry, material );
            this.scene.add( this.floorPlane );  
            this.floorPlane.position.set(0,0,0);

        }

    }

    addLogo = () =>{
        if(this.logoPlane){
            this.scene.add( this.logoPlane );
            this.logoPlane.position.set(0,100,-500);

        } else {
            console.log( this.dimensions.width, this.dimensions.depth);
            const geometry = new THREE.PlaneGeometry( 1000, 463 );
            let texture = new THREE.TextureLoader().load('images/nftz_logo.png' );
            const material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, map:texture } );
            this.logoPlane = new THREE.Mesh( geometry, material );
            this.scene.add( this.logoPlane );  
            this.logoPlane.position.set(0,100,-500);
        }

    }

    removeFloor = () =>{
        this.scene.remove( this.floorPlane );
    }

    addClickListenerFullScreen = (ctr, el, modelUrl) => {
        let that = this;

        //console.log('adding listener for '+modelUrl);
        el.addEventListener("click", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            that.openFullscreen();
            that.resizeCanvas(true);
        });     
    }    

    addClickListenerVR = (ctr, el, modelUrl) => {
        let that = this;

        //console.log('adding listener for '+modelUrl);
        el.addEventListener("click", (e)=>{
            e.preventDefault();
            e.stopPropagation();
            that.openVR();
            //that.resizeCanvas(true);
        });     
    }   

    openVR = (el) =>{


    }
    updateLink = (linkEl, linkText)=> {
        linkEl.text = linkText;
    }

    findElFrom = (elClassName, ctr) =>{
        let targetEl = null;
        let matchedEls = ctr.getElementsByClassName(elClassName);
        if(matchedEls.length>0){
            targetEl = matchedEls[0];
        };
        return targetEl;
    }

    initNFTs = (container)=>{
        if(!container){
            container = document.body;
        };
    
        let nftContainers = Array.from(container.getElementsByClassName(this.config.ctrClass));

        nftContainers.forEach(this.initModel);        
    }

    initModel = (el) => {
        const that = this;
        let modelStatus = el.getAttribute('model-status');
        if(!modelStatus){
            modelStatus = 'requested';
            el.setAttribute('model-status',modelStatus);
        };
        if(modelStatus!=='available'){
            let nftPostHash = el.getAttribute(this.config.nftDataAttr);
            let url = '/'+this.config.nftsRoute+'/'+nftPostHash;
            fetch(url,{ method: "post"})
            .then(response => response.json())
            .then((data)=>{ 

                if(data !== undefined){
                    let fullUrl = '/'+that.config.modelsRoute+'/'+nftPostHash+data.modelUrl;
                    this.updateUI(el, fullUrl);
                };

            }).catch(err => {
                console.log(err);
                console.log(response);
            });
        };

    }    
}

export {D3DSpaceViewer};