<?php

class Error
{
	const None = 0;

	const BadHttpMethod = 1;

	const BadRecord = 2;

	const BadCacheOperation = 3;

	const BadArguments = 4;

    const BadPayload = 5;

    const BadBinSearch = 10;

	const SecretNotFound = 101;

	const BadSession = 201;

    const AuthFailed = 202;

    const RegisterFailedForPhoneNumberExists = 1001;

    const RegisterFailedForBadUsernameOrPassword = 1002;


}
