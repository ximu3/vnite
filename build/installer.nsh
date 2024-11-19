!macro customInstall
  DetailPrint "Register vnite URI Handler"
  DeleteRegKey HKCR "vnite"
  WriteRegStr HKCR "vnite" "" "URL:Vnite Protocol"
  WriteRegStr HKCR "vnite" "URL Protocol" ""
  WriteRegStr HKCR "vnite\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "vnite\shell" "" ""
  WriteRegStr HKCR "vnite\shell\Open" "" ""
  WriteRegStr HKCR "vnite\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend
