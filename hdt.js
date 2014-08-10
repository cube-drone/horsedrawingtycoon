var emitter = new LucidJS.EventEmitter();

function horse(){
    var canvas, stage;
    var drawingCanvas;
    var oldPt;
    var oldMidPt;
    var title;
    var color;
    var stroke;
    var colors;
    var index;

    canvas = document.getElementById("horse");
    index = 0;
    color = "#000000";
    //check to see if we are running in a browser with touch support
    stage = new createjs.Stage(canvas);
    stage.autoClear = false;
    stage.enableDOMEvents(true);
    createjs.Touch.enable(stage);
    createjs.Ticker.setFPS(24);

    function handleMouseDown(event) {
        stroke = Math.random()*30 + 10 | 0;
        oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
        oldMidPt = oldPt;
        stage.addEventListener("stagemousemove" , handleMouseMove);
    }
    function handleMouseMove(event) {
        var midPt = new createjs.Point(oldPt.x + stage.mouseX>>1, oldPt.y+stage.mouseY>>1);
        drawingCanvas.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
        oldPt.x = stage.mouseX;
        oldPt.y = stage.mouseY;
        oldMidPt.x = midPt.x;
        oldMidPt.y = midPt.y;
        stage.update();
    }
    function handleMouseUp(event) {
        stage.removeEventListener("stagemousemove" , handleMouseMove);
    }
    function changeColor(newcolor){
        console.log("change color:", newcolor)
        color = newcolor;
    }
    function clearCanvas(){
        console.log("clearing canvas");
        stage.removeAllChildren();
        stage.update();
    }

    emitter.bind('changeColor', changeColor)
    emitter.bind('clearCanvas', clearCanvas)

    drawingCanvas = new createjs.Shape();
    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.addChild(drawingCanvas);
    stage.update();
    
}

$(function() {
    horse();
    
    $("#clear").click(function(){
        emitter.emit("clearCanvas");
    });
    $(".color").click(function(el){
        emitter.emit("changeColor", $(el.target).data('color')) 
    });
});

