<?php

class ShortMsg
{
    // For test only
    const Username = 'bjyyhd-1';

    const Password = 'c9bf87';

    private static function query($target, $message)
    {
        $username = self::Username;
        $password = self::Password;
        $content = iconv("utf-8", "gb2312//IGNORE", $message);
        return "?un=$username&pwd=$password&mobile=$target&msg=$content";
    }

    public static function send($target, $message)
    {
        $query = self::query($target, $message);
        $xml = file_get_contents('http://si.800617.com:4400/SendLenSms.aspx' . $query);
        $r = simplexml_load_string($xml);

        return $r->Result == '1';
    }

}
