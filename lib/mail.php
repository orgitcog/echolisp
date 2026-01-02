<?

$to="contact@magenia.com";

$subjet = "Fiche de renseignement";

$corps = '
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
"http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<title>Untitled Document</title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<style type="text/css">
<!--
.style5 {	color: #A29785;
	font-weight: bold;
}
.style7 {	font-size: 10px;
	font-weight: bold;
	font-style: italic;
}
-->
</style>
</head>

<body>
Nom : '.addslashes($nom).'<br>
Pr&eacute;nom : <'.addslashes($prenom).'<br>
Nationalit&eacute; : '.addslashes($nationalite).'<br>
Adresse de r&eacute;sidence : '.addslashes($adresse).'<br>
T&eacute;l&eacute;phone Fixe : '.addslashes($telephonefixe).'<br>
T&eacute;l&eacute;phone Mobile : '.addslashes($telephonemobile).'<br>
Email : '.addslashes($email).'<br>
Niveau d\'&eacute;tudes : '.addslashes($etudes).'<br>
Profession : '.addslashes($profession).'<br><br>
Vous &ecirc;tes int&eacute;ress&eacute; par :<br>';
if ($interesse_par_formation==1) $corps .= '  - La formation professionnelle<br>';
if ($interesse_par_stages==1) $corps .= '  - Les stages<br>';
if ($interesse_par_afdas==1) $corps .= '  - Un plan de formation AFDAS<br>';
if ($interesse_par_ne_sait_pas_encore==1) $corps .= '  - Ne sait pas encore<br>';
if ($interesse_par_a_preciser<>"") $corps .= '  - autre : '.addslashes($interesse_par_ne_sait_pas_encore).'<br>';
$corps .= '	<br>  
Quels ateliers compl&eacute;mentaires souhaitez-vous suivre :<br>';
if ($ateliers_danse_contemporaine==1) $corps .= '  - Danse Contemporaine<br>';
if ($ateliers_theatre==1) $corps .= '  - Theatre<br>';
if ($ateliers_chant_lyrique_et_variete==1) $corps .= '  - Chant Lyrique et Variete<br>';
if ($ateliers_ne_sait_pas_encore==1) $corps .= '  - Ne sait pas encore<br>';
$corps .= '  <br>
Message : '.addslashes($message).'
</body>
</html>
';

$entete="Content-type:text/html\nFrom:$email";

mail ($to,$subjet,$corps,$entete);
//mail ("rlewinger@lespritnet.com",$subjet,$corps,$entete);

echo '<SCRIPT LANGUAGE="javascript">window.close();</SCRIPT>';

?>