/*
Le-L
	French localisation
*/


var msgPass = "Move a token or pass (click on both).";
if(language == 'fr') {
msgPass = "Déplacez un jeton ou passez (click sur chacun).";

function dlgCompleted() {
	if(game.completed === GWIN ) { // user Wins 
  		playSound(sndWin);
  		dlgShow( 
  				  "Vous avez gagné !!!"
  				+ BR +  "Niveau " + gLevel.level + " terminé." 
  		        + strScoreHTML(gLevel.level) 
  				+ (game.player ? '' : BR + "<small>[Niveau suivant] pour grimper.</small>")
  				+ BR + "<small>[Autre partie] pour une nouvelle partie.</small>"
  				,'orange');
  		return;
  	}
  	
  	if(game.completed === GLOSS ) { 
  		playSound(sndLoss);
  		dlgShow( 
  				  "Perdu... "
  		        + strScoreHTML(gLevel.level) 
  				+ BR + "<small>[Autre partie] pour une nouvelle partie.</small>"
  				,'lightblue');
  		return;
  	}
  	if(game.completed === TIMEOUT ) { 
  		playSound(sndLoss);
  		dlgShow( 
  				 "Perdu ... "
  				+ BR + "Temps épuisé."
  		        + strScoreHTML(gLevel.level) 
  				+ BR + "<small>[Nouvelle partie] pour une autre partie.</small>"
  				,'lightgreen');
  		return;
  	}
} // dlgCompleted



function strScores () { // ---> string
getScores(); 
	var s = localStorage.getObj("ECHOLALIE-CRAM-APPNAME");
	s += ' - ' + (gLevels.length -1) + ' niveaux.' +  NL;
	s += 'Niveaux | Gains | Parties'  + NL + NL ;
	for(var i=1; i< gScores.length;i++) {
	var aScore = gScores[i] ;
	if(!aScore) continue;
	var d = new Date(aScore.date);
	s+= ' ' + aScore.level + TAB;
	s+= ' ' + aScore.wins + TAB;
	s+= ' ' + aScore.games  + NL;
	// s+= ' ' + aScore.moves + ' /' +  gLevels[i].maxMoves  + TAB;
	// s+= TAB + d.toLocaleDateString() + NL;
	}

	if(gScores.length <= 1) s += 'Aucun niveau terminé.' + NL;
	s+= NL + NL + 'Force: ' + userStrength() + '%';
	return s; 
}


function strScoreHTML (level) { // -> HTML line or ''
getScores();
	var aScore = gScores[level] ;
	if(!aScore) return '' ;
	var s = '<br><small>'
	// s+= 'Moves: ' + aScore.moves + ' /' + gLevels[level].maxMoves  + NBSP;
	s+= 'Gains: ' + aScore.wins + NBSP; ;
	s+= 'Parties: ' + aScore.games  + NBSP;
	s+= BR + 'Force: ' +  userStrength()  +' %' ;
	// s+= BR + d.toLocaleDateString() ;
	s += '</small>';
	return s;
}
info("French loaded");
} ; // FRENCH