<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-7-23
 * Time: 下午11:52
 */

class DownloadController extends ApiController
{
    // ZM: 北京站有两个文件下载的地方，走这里。
    public function hpgeAction($station, $sid, $fileName)
    {
        Header("HTTP/1.1 303 See Other");
        Header("Content-type: application/octet-stream");
        Header("Location: /file/$station/hpge/$sid/$fileName");
        exit;
    }

    public function labrAction($station, $month, $day, $fileName)
    {
        Header("HTTP/1.1 303 See Other");
        Header("Content-type: application/octet-stream");
        Header("Location: /file/$station/labr/$month/$day/$fileName");
        exit;
    }
} 