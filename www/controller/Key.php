<?php

class Key
{
    // u:v:code:#{phone_number} => int
    // TTL
    const StationDeviceData = "s:d:d";

    const StationDeviceLatest = "s:d:time";

    const StationDeviceLatestStatus = "s:d:stat";

    const StationCinderellaSid = "s:d:sid";

    const StationDeviceFieldRule = "s:d:f:";

    const StationCommandQueue = 's:c:q@';

    const StationCinderellaStatus = 's:c:s@';

    const KeepAlive = "keep-alive";
}
