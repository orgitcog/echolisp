/**
 *
 * Created by GB on 01/11/2014
 * Copyright (c) echolalie.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * usage :  GBToggle.Height('elem id', true | false);
 */


var GBToggle =
{
    /**
     * Helpers.
     */
 
    elementHeight: function(id)
    {
        var element = document.getElementById(id);
        return 
        	element.offsetHeight || element.style.pixelHeight ;
    },

    /**
     * Animation tick.
     */
     
    duration : 1000 ,
    t0 : 0,
    timer : null,
    
    animateHeight: function(elem,fromHeight,toHeight)
    {
        var difference = toHeight - fromHeight;

        // Snap, then stop if arrived.
        var dt = Date.now() - this.t0 ;
        if (dt  >= this.duration)
        {
            // Apply target.
            clearInterval(this.timer);
            elem.style.height = '' + Math.floor(toHeight) + 'px' ;
            return;
        }

        // Filtered position.
        var x = dt / this.duration ;
        x = x*x*(3 - 2*x); // smoothstep
        var currentHeight = fromHeight + difference * x ;
		
        // Apply target.
       elem.style.height = '' + Math.floor(currentHeight) + 'px' ;
    },


    /**
     * For public use.
     *
     * @param id The id of the element to scroll to.
     * @param expand : true | false
     */
    Height: function(id, expand)
    {
        var element = document.getElementById(id);
        if (element == null)
        {
            console.warn('GB:Cannot find element with id \''+id+'\'.');
            return;
        }

		var trueHeight = this.elementHeight(id);
		var fromHeight, toHeight;
		if(expand) {
					fromHeight = 0;
					toHeight = trueHeight;
					}
				else {
					fromHeight = trueHeight;
					toHeight = 0;
				}

        // Start animation.
        this.t0 = Date.now();
        this.timer = setInterval(function() {
        		GBToggle.animateHeight(element,fromHeight,toHeight);}, 30 ) ; // 1000/fps
    }
};