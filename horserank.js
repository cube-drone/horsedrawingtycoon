
HorseRank = {}

HorseRank.eachPixel = function(canvas, context, fn){
    var image_data = context.getImageData(0, 0, canvas.width, canvas.height)
    var data = image_data.data;
    for(var i = 0, n = data.length; i < n; i+=4){
        var red = data[i];
        var green = data[i+1];
        var blue = data[i+2];
        var alpha = data[i+3];
        fn(red, green, blue, alpha);
    };
}

HorseRank.singlePixel = function(canvas, context, x, y, fn){
    var image_data = context.getImageData(0, 0, canvas.width, canvas.height)
    var data = image_data.data;
    var imageWidth = canvas.width;
    var red = data[((imageWidth * y) + x) * 4];
    var green = data[((imageWidth * y) + x) * 4 + 1];
    var blue = data[((imageWidth * y) + x) * 4 + 2];
    var alpha = data[((imageWidth * y) + x) * 4 + 3];
    fn(red, green, blue, alpha);
};

HorseRank.hexify = function(colorvalue){
    var hex = colorvalue.toString(16);
    if(hex.length == 1){
        return "0"+hex;
    }
    return hex;
}

HorseRank.buildColor = function(red, green, blue, alpha){
    // Given a R, G, B, A value, build a #rrggbb CSS value. 
    if(alpha == 0){
        return "#FFFFFF";
    }
    var redstring = HorseRank.hexify(red);
    var greenstring = HorseRank.hexify(green);
    var bluestring = HorseRank.hexify(blue);
    return "#"+redstring+greenstring+bluestring;
}

HorseRank.analyze = function(canvas, context){
        var analysis = {};

        //Build the ColorHistogram
        var colorhistogram = {};
        HorseRank.eachPixel(canvas, context, function(red, green, blue, alpha){
            var hexcolor = HorseRank.buildColor(red, green, blue, alpha);
            if( ! colorhistogram.hasOwnProperty(hexcolor) ){
                colorhistogram[hexcolor] = 0;
            }
            colorhistogram[hexcolor]++;
        });

        //Find Dominant and Secondary Color from the ColorHistogram
        var dominant_color = "#FFFFFF";
        var dominant_number = 30;
        var secondary_color = "#FFFFFF";
        var secondary_number = 30;
        for (var key in colorhistogram) {
            if (colorhistogram.hasOwnProperty(key)) {
                if(colorhistogram[key] < 30){
                    delete colorhistogram[key]
                }
                if(colorhistogram[key] > dominant_number){
                    dominant_color = key;
                    dominant_number = colorhistogram[key];
                }
                if(colorhistogram[key] > secondary_number &&
                    colorhistogram[key] < dominant_number){
                    secondary_color = key;
                    secondary_number = colorhistogram[key];
                }
            }
        }
        analysis['colorhistogram'] = colorhistogram;
        analysis['dominant_color'] = dominant_color;
        analysis['secondary_color'] = secondary_color;

        // Look at the four corners of the canvas
        HorseRank.singlePixel(canvas, context, 0, 0, function(r, g, b, a){
            analysis['top-left'] = HorseRank.buildColor(r,g,b,a);
        });
        HorseRank.singlePixel(canvas, context, canvas.width-1, 0, function(r, g, b, a){
            analysis['top-right'] = HorseRank.buildColor(r,g,b,a);
        });
        HorseRank.singlePixel(canvas, context, 0, canvas.height-1, function(r, g, b, a){
            analysis['bottom-left'] = HorseRank.buildColor(r,g,b,a);
        });
        HorseRank.singlePixel(canvas, context, canvas.width-1, canvas.height-1, function(r, g, b, a){
            analysis['bottom-right'] = HorseRank.buildColor(r,g,b,a);
        });
        HorseRank.singlePixel(canvas, context, parseInt((canvas.width-1)/2), 
                              parseInt((canvas.height-1)/2), function(r, g, b, a){
            analysis['center'] = HorseRank.buildColor(r,g,b,a);
        });
        

        return analysis;
    }
