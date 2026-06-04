; Hooks NSIS personnalisés pour electron-builder.
; Supprime le dossier d'installation résiduel (NSIS le laisse souvent vide).
!macro customUnInstall
  RMDir /r "$INSTDIR"
!macroend
