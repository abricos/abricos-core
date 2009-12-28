@ECHO OFF

SET phpCli=d:\web\usr\bin\php5.exe

IF EXIST "%phpCli%" (
  "%phpCli%" jsdoc %*
  GOTO :EOF
) ELSE (
  
  ECHO ** ERROR *****************************************************************
  ECHO * Sorry, can't find the php.exe file.
  ECHO * You must edit this file to point to your php.exe (CLI version!)
  ECHO *    [Currently set to %phpCli%]
  ECHO **************************************************************************
)
