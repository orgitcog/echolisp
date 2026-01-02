

var fmenu = function (target,key,item) {
console.log("target",target);
console.log("key",key);
console.log("item",item);
}

var menu = {
      // Basic menu option: Key and onSelect
      "New" : fmenu,
 
      // More advanced options
      "Open" : {
          onSelect : fmenu,
          enabled : true, // Use false for disabled, default true
          text : "Open...", // Overrides the key, always use if array
          title : "Open a file" // Title attribute for menu item
      },
 
      // More parameters in onSelect function
      "Save" : {
          // target : DOM object that was clicked to open menu
          // key : The key of the menu object, in this case, "Save"
          // item : DOM object of the menu item that was clicked
          onSelect : fmenu 
          }
     
  }
  
function install_menu() {
	ContextMenu.attach(document.getElementById('cell'),menu, {}) ;
}

function cmenu(event) {
console.log("clicked");
event.stopPropagation();
		event.preventDefault();
		 		ContextMenu.display( event.target, menu, { horizontalOffset : 5 } );
		 	} 
  
  
  
  
window.onload = install_menu ;