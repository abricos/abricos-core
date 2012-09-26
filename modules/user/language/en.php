<?php
return array(
	'brick' => array(
		'templates' => array(
			"1" => "Register - Activate your account",
			"2" => "Dear {v#username},

You have successfully logged on. 

To activate your account, you need to pass the last point of registration!

To become a registered user, you need to follow once the link below and your account will be included in the user base.

To complete registration, follow this link: <a href=\"{v#link}\">{v#link}</a>

All the best,
{v#sitename}",
			"3" => "Information about your account to access the {v#sitename}",
			"4" => "Dear,

You have requested the password to re-install {v#email}, since forgot your password.
If you did not make such a request, please do not reply to this message. 
The request will be automatically canceled after 24 hours.

To re-set your password, please follow the page: <a href=\"{v#link}\">{v#link}</a>.
At the entrance to this page, your password will be reset and a new password will be sent to you via email.

Your Username: {v#username}

All the best,
{v#sitename}")
,
		'userblock' => array(
			"1" => "Username",
			"2" => "Password",
			"3" => "Register a new account",
			"4" => "Registration",
			"5" => "Password Recovery",
			"6" => "Forgot your password?",
			"7" => "Remember me",
			"8" => "Login",
			"9" => "Go to Control Panel",
			"10" => "Logout",
			"11" => "Control Panel",
			"12" => "Go to Control Panel",
			"13" => "Control Panel",
			"14" => "Logout",
			"15" => "Open Application Manager",
			"16" => "Applications",
			"17" => "Please, wait",
			"18" => "Build a list of applications..."
		)

	)
,
	'content' => array(
		'activate' => array(
			"1" => "Activating the user was successful.",
			"2" => "Username",
			"3" => "Activation error",
			"4" => "User not found",
			"5" => "The user is already activated",
			"6" => "Unknown error",
			"7" => "Activation of registration"
		)
,
		'index' => array(
			"1" => "Loading data. Please, wait..."
		)
,
		'index_guest' => array(
			"1" => "Loading data. Please, wait...",
			"2" => "<a href=\"http://abricos.org\" target=\"_blank\">Abricos Platform</a>"
		)
,
		'login' => array(
			"1" => "The error in the username",
			"2" => "Wrong username or password",
			"3" => "Not filled in the required fields",
			"4" => "User is blocked",
			"5" => "This user has not passed the verification email",
			"6" => "Authorization error",
			"7" => "Authorization for the site"
		)
,
		'logout' => array(
			"1" => "Authorization for the site"
		)
,
		'recpwd' => array(
			"1" => "Your new password to access the %1",
			"2" => "Dear %1,
At your request, your password has been reset. New information about the password is:
Username: %1
Password: %2
You can change the password on your personal page.
All the best,
%3",
			"3" => "Your password has been reset and sent to your email: {v#email}",
			"4" => "Check your mail",
			"5" => "The system could not recognize the ID password",
			"6" => "Perhaps this is due to the expiration of the allotted a password change.",
			"7" => "If you still want to ask for instructions to restore the password
then use <a href=\"#\" onclick=\"Brick.f('user', 'api', 'showPwdRestPanel'); return false;\">the password recovery</a> "
		)
,
		'register' => array(
			"1" => "This username is already registered on the site",
			"2" => "User with this email is already registered",
			"3" => "Invalid username",
			"4" => "Invalid email format",
			"5" => "Passwords does not match",
			"6" => "Email is not the same",
			"7" => "Registration Error: {v#err}",
			"8" => "Username",
			"9" => "Password",
			"10" => "Please enter your password. Password is case sensitive.",
			"11" => "Password",
			"12" => "Confirm Password",
			"13" => "Email Address",
			"14" => "Please enter a valid email address.",
			"15" => "Email Address",
			"16" => "Confirm Email Address",
			"17" => "Sign up",
			"18" => "An application for registration is successfully accepted.",
			"19" => "In your email \"{v#email}\" sent a letter to the confirmation of registration.",
			"20" => "Check your e-mail.",
			"21" => "Register on the site"
		)

	)
);
?>