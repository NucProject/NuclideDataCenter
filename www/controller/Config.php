<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-6-7
 * Time: 上午8:06
 */

class Config
{
    public static $m = array(

        'hpic' => array(
            '0102060301' => 'doserate',
            '0102069901' => 'battery',
            '0102069902' => 'highvoltage',
            '0102069903' =>	'temperature',
            'time' => 'time'
            ),

            /* TODO: Need parse .N42 file.*/
        'labr' => array(
            'time' => 'time'
            ),

        'weather' => array(
            '0901040101' => 'Temperature',
            '0901040102' => 'Humidity',
            '0901040103' => 'Pressure',
            '0901040106' => 'Windspeed',
            '0901040105' => 'Direction',
            '0901040104' => 'Raingauge',
            '0901040107' => 'IfRain',
            'time' => 'time'
            ),

        'environment' => array(
            '0102069909' => 'IfMainPowerOff',
            '0102069910' => 'BatteryHours',
            '0102069906' => 'IfDoorOpen',
            '0102069907' => 'Temperature',
            '0102069911' => 'Humidity',
            '0102069912' => 'IfSmoke',
            '0102069913' => 'IfWater',
            'time' => 'time'
            ),

        'cinderelladata' => array(
            '01' => 'DeviceTime',
            '02' => 'Sid',
            '03' => 'barcode',
            '04' => 'BeginTime',
            '05' => 'WorkTime',
            '06' => 'Flow',
            '07' => 'FlowPerHour',
            '08' => 'Pressure',
            '09' => 'PressureDiff',
            '0A' => 'Temperature',
            'time' => 'time'
            ),

        'cinderellastatus' => array(
            '01' => 'StateBits',
            'time' => 'time'
            )
        );


} 