!macro customInit
  MessageBox MB_OKCANCEL|MB_ICONQUESTION "Do you want to install Orbit Browser on your computer?" IDOK proceed
  Quit
  proceed:
!macroend

!macro customInstall
  DetailPrint "Registering Orbit as Windows Web Browser..."
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit" "" "Orbit Browser"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\DefaultIcon" "" "$INSTDIR\Orbit.exe,0"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\shell\open\command" "" '"$INSTDIR\Orbit.exe"'
  
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities" "ApplicationDescription" "Orbit Desktop Browser by Worcco"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities" "ApplicationIcon" "$INSTDIR\Orbit.exe,0"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities" "ApplicationName" "Orbit"
  
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities\FileAssociations" ".htm" "OrbitHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities\FileAssociations" ".html" "OrbitHTML"
  
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities\URLAssociations" "http" "OrbitHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities\URLAssociations" "https" "OrbitHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Orbit\Capabilities\URLAssociations" "orbit" "OrbitHTML"
  
  WriteRegStr HKCU "Software\RegisteredApplications" "Orbit" "Software\Clients\StartMenuInternet\Orbit\Capabilities"
  
  WriteRegStr HKCU "Software\Classes\OrbitHTML" "" "Orbit HTML Document"
  WriteRegStr HKCU "Software\Classes\OrbitHTML\DefaultIcon" "" "$INSTDIR\Orbit.exe,0"
  WriteRegStr HKCU "Software\Classes\OrbitHTML\shell\open\command" "" '"$INSTDIR\Orbit.exe" "%1"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Clients\StartMenuInternet\Orbit"
  DeleteRegValue HKCU "Software\RegisteredApplications" "Orbit"
  DeleteRegKey HKCU "Software\Classes\OrbitHTML"
!macroend
