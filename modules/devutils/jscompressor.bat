@ECHO OFF

SET phpCli=C:\web\usr\bin\php5.exe

::IF '%1'=='' (
::  ECHO ******************************************************************************
::  ECHO * JSCompressor Command-Line Starter
::  ECHO ******************************************************************************
::)

IF EXIST "%phpCli%" (
  :: CALL :exec GOTO :run
  "%phpCli%" jscompressor %*
  GOTO :EOF
) ELSE GOTO :NoPhpCli


::
:: php.exe not found error  
GOTO :PAUSE_END
:NoPhpCli
ECHO ** ERROR *****************************************************************
ECHO * Sorry, can't find the php.exe file.
ECHO * You must edit this file to point to your php.exe (CLI version!)
ECHO *    [Currently set to %phpCli%]
ECHO **************************************************************************

::
:: Stupid MS-batch: Can't evaluate environment variable inside a FOR loop!!! :((  
GOTO :PAUSE_END
:exec 
%*
GOTO :EOF

::
:: Start the JSCompressor
GOTO :PAUSE_END
:run
ECHO Starting: "%phpCli%" jscompressor
ECHO.
"%phpCli%" jscompressor
GOTO :EOF


:PAUSE_END
PAUSE