export const name = 'DSO_LayoutBuilder';

class LayoutBuilder {
	   
	   constructor(config) {

        let defaults = {
                    items: [{width: 1, height:1, depth:1},{width: 1, height:1, depth:1},{width: 1, height:1, depth:1},{width: 1, height:1, depth:1},{width: 1, height:1, depth:1}]
                };
        
        this.config = {
            ...defaults,
            ...config
        };

        this.dimensions = this.calcDimensionsSquare();
    }

    calcDimensionsSquare = () =>{

    	this.totalArea = this.calcTotalArea();

    	return {	width:this.totalArea/2,
    				height:10, 
    				depth:this.totalArea/2};
  
    }

    calcTotalArea = () =>{
    	let area = this.config.items.length;
    	if(this.isOdd(this.totalArea)){
    		area++;
    	};
    	return area;
    }

	isOdd = (num) => {
		return (num % 2) == 1;
	}
}

export {LayoutBuilder}