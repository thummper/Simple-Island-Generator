
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let rand = Math.floor(Math.random() * (max - min)) + min;
    return rand; //The maximum is exclusive and the minimum is inclusive
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min; //The maximum is exclusive and the minimum is inclusive
} 





class Island{
    constructor(boundingBox, seed){
        this.boundingBox = boundingBox;
        this.seed = seed; 

        this.vornoi = new Voronoi();
        this.diagram;
        this.idEdges;
    }


    generate(){
        let randomSites = this.generateRandomPoints(1000, this.boundingBox);
        let tmpDiagram = this.vornoi.compute(randomSites, this.boundingBox);
        let tmpIdEdges = this.getIDEdges(tmpDiagram.edges);

        // Relax voronoi to get more similarly sized cells 
        for(let i = 0; i < 3; i ++){
            let newSites = this.relax(tmpDiagram, tmpIdEdges);
            tmpDiagram   = this.vornoi.compute(newSites, this.boundingBox);
            tmpIdEdges   = this.getIDEdges(tmpDiagram.edges);
        }
        // Sort edges by angle so we can draw polygons. 
        console.log("TEMPIDEDGES: ", tmpIdEdges);
        tmpIdEdges = this.sortEdges(tmpIdEdges);

        // Save relaxed diagram. 
        this.diagram = tmpDiagram;
        this.idEdges = tmpIdEdges;

        // Now we need to assign land types to vornoi cells.L0
        this.diagram.cells = this.giveElevation(this.diagram.cells, this.boundingBox);
    }


    // Given object {ref: , edges: }, sorts edges based on angle away from ref point.
    sortEdges(idEdges) {
        for (let edgeSet of idEdges) {
            let ref = edgeSet.ref;
            let edges = edgeSet.edges;
            // Given Center of reference point, assign an angle to edges and then sort.L0
            for (let i in edges) {
                let point = edges[i];
                let angle = Math.atan2(ref.y - point.y, ref.x - point.x);
                angle *= 180 / Math.PI;
                point.angle = angle;
            }
            edges = edges.sort((a, b) => (a.angle <= b.angle) ? -1 : 1);
        }
        return idEdges;
    }

    // Generate Random Points inside of bounding box.
    generateRandomPoints(number, boundingBox){
        let sites = [];
        for(let i = 0; i < number; i++){
            let randX = getRandomInt(0, boundingBox.xr);
            let randY = getRandomInt(0, boundingBox.yb);
            let site = {
                x: randX,
                y: randY
            };
            sites.push(site);
        }
        return sites;
    }

    // Given edges array [edge, ], produces an array, [ voronoiId: {ref: , edges: }, vor.. ],
    // The array keys are id's of vornoi cells, each element contains the center of the point and all of its verts
    getIDEdges(edges){
        let idEdges = [];
        for(let edge of edges){
            let lSite = edge.lSite;
            let rSite = edge.rSite;
            idEdges = this.siteDetails(edge, lSite, idEdges);
            idEdges = this.siteDetails(edge, rSite, idEdges);
        }
        return idEdges;
    }
    
    siteDetails(edge, site, idEdges){
        let va = edge.va;
        let vb = edge.vb;
        if(site){
            // IF the site exists, we are going to be pushing edges.
            let id = site.voronoiId;
            if(idEdges[id]){
            } else {
                idEdges[id] = {};
                idEdges[id].ref = site;
                idEdges[id].edges = [];
            }
            // Push edges here.
            if(va.x !== site.x && va.y !== site.y){
                idEdges[id].edges.push(va);
            }
            if(vb.x !== site.x && vb.y !== site.y){
                idEdges[id].edges.push(vb);
            }
        }
        return idEdges;
    }

    // Given an array of cells and bounding box, assigns noise to the cell which in turn is used to assign land type.
    giveElevation(cells, boundingBox){
        for(let cell of cells){
            let site = cell.site;   
            let x = site.x;
            let y = site.y;
            let nse = noise.simplex2(x/100, y/100);
            let dst = this.d2e(x, y, boundingBox)/ getRandom(0.6, 1.5);
            nse = (1 + nse - dst) / getRandom(0.8,2.5);
    
            if(nse < - 80){
                site.type = "land";
            } else {
                site.type = "water";
            }   
        }
        return cells;
    }

    // Given x, y and bounds, returns distance to closest edge. (perhaps this should be average?)
    d2e(x, y, boundingBox) {
        let distance = 1000000;
        let dTop = y;
        let dBottom = boundingBox.yb - y;
        let dRight = boundingBox.xr - x;
        let dLeft = x;
        let cmp = [dTop, dBottom, dRight, dLeft];
        for (let val of cmp) {
            if (val <= distance) {
                distance = val;
            }
        }
        return distance;
    }

    // Given diagram and idEdges, relaxes the diagram (moves site points towards center of voronoi cell)
    relax(diagram, idEdges){
        // Given voronoi diagram, adjust sites
        let newSites = [];
        let cells = diagram.cells;
        for(let cell of cells){
            let site = cell.site;
            let id   = site.voronoiId;
            let verticies = idEdges[id].edges;
            
            let sumX = 0;
            let sumY = 0;
    
            for(let vertex of verticies){
                sumX += vertex.x;
                sumY += vertex.y;
            }
    
            let midX = sumX / verticies.length;
            let midY = sumY / verticies.length;
    
            newSites.push({x: midX, y: midY});
        }
        return newSites;
    }


}

function generateIsland(boundingBox, seed, ctx){

    // We need to give sites some elevation.
    diagram.cells = giveElevation(diagram.cells, boundingBox);
    drawIsland(idEdges, ctx);

}


// Drawing Functions
function drawIsland(idEdges, ctx){
    for(let site of idEdges){
        let edges = site.edges;
        let reference = site.ref;
        let type = reference.type;
        drawPolygon(edges , ctx, type);
    }
    ctx.beginPath();
} 

function drawPolygon(edges, ctx, type){
    // Given edges (verticies), draw a polygon.L0
    ctx.beginPath();
    ctx.moveTo(edges[0].x, edges[0].y);
    for(let i = 1; i < edges.length; i++){
        let point = edges[i];
        ctx.lineTo(point.x, point.y);
    }
    ctx.lineTo(edges[0].x, edges[0].y);
    ctx.closePath();
    if(type == "water"){
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";
    } else {
        ctx.fillStyle = "orange";
        ctx.strokeStyle = "black";
    }
    ctx.stroke();
    ctx.fill();
}




window.addEventListener("load", function () {
    let canvas = document.getElementById("islandCanvas");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    let ctx = canvas.getContext("2d");

    let boundingBox = {
        xl: 0,
        xr: 1000,
        yt: 0,
        yb: 600
    }

    let seed = getRandom(1, 6000);
    let island = new Island(boundingBox, seed);
    island.generate();
    drawIsland(island.idEdges, ctx);

 
});