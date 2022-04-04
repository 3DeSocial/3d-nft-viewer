export const name = 'd3d-space-viewer';
let THREE, GLTFLoader, OrbitControls, XRControllerModelFactory, VRButton;

class Item {

    constructor(config){
        let defaults = {
            modelUrl: ''
        };
    
        this.config = {
            ...defaults,
            ...config
        };
        
        THREE = this.config.three;
        this.scene = this.config.scene;
        this.height = this.config.height;
        this.width = this.config.width;
        this.depth = this.config.depth;

        console.log('item loaded');
        console.log(THREE);


    }

    place = (pos, rotation) =>{

        let that = this;

        this.fetchModel()
            .then((mesh)=>{
                that.mesh = mesh;
                that.positionItem();
                that.rotateItem();
                that.addToScene();
            })
        

    }

    fetchModel = async(item) =>{
        let that = this;
        return new Promise((resolve,reject)=>{
            console.log('create item:',that.config.width, that.config.height,that.config.depth);
            const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
            if(!this.config.color){
                this.config.color = 0xfffff;
            };
            const material = new THREE.MeshBasicMaterial( { color: this.config.color} );

            let mesh = new THREE.Mesh( geometry, material );
            resolve(mesh);
        })
      
    }

    positionItem = (posVector) =>{
        this.mesh.position.copy(posVector);
   //     console.log('position set');
    //    console.log(posVector);
    }

    rotateItem = () =>{

    }

    addToScene = () =>{
        this.scene.add(this.mesh);
    }

}

 class D3DInventory {
    
    constructor(config) {

        let defaults = {
                    items: []
                };
        
        this.config = {
            ...defaults,
            ...config
        };

        THREE = this.config.three;
        this.scene = this.config.scene;

        console.log('D3DInventory');
        console.log(THREE);

        this.items = [];

        this.load();
      
    }

    load = () =>{
        this.initItems(this.config.items);
    }

    initItems = (itemList)=>{

        let that = this;
        console.log('initItems');
        console.log(itemList);
        itemList.forEach((itemData)=>{
            itemData.three = THREE;
            itemData.scene = this.scene;
            let item = new Item(itemData);
            that.items.push(item);

        })
    }

    getItems = () =>{
        return this.items;
    }


 }
export {D3DInventory, Item};