<?php

class Crypt
{
    public static function encrypt($d, $key)
    {
        $iv = mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_DES, MCRYPT_MODE_ECB), MCRYPT_RAND);

        $r = mcrypt_encrypt(MCRYPT_DES ,$key, $d, MCRYPT_MODE_ECB, $iv);
        return base64_encode($r);
    }

    public static function decrypt($base64, $key)
    {
        $iv = mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_DES, MCRYPT_MODE_ECB), MCRYPT_RAND);

        $d = base64_decode($base64);
        $str = mcrypt_decrypt(MCRYPT_DES ,$key, $d, MCRYPT_MODE_ECB, $iv);
        return trim($str);
    }

}