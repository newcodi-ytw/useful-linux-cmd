lte_at

4) Send AT command to force the module transmit power
For EV charger, Band 3, 8, 20 is mainly used.
lte_at "AT+QRFTEST=\"LTE BAND3\",19575,\"ON\",58,1"
lte_at "AT+QRFTEST=\"LTE BAND3\",19575,\"OFF\",58,1"
lte_at "AT+QRFTEST=\"LTE BAND8\",21625,\"ON\",67,1"
lte_at "AT+QRFTEST=\"LTE BAND8\",21625,\"OFF\",67,1"
lte_at "AT+QRFTEST=\"LTE BAND20\",24300,\"ON\",67,1"
lte_at "AT+QRFTEST=\"LTE BAND20\",24300,\"OFF\",67,1"

lte_at AT+QRFTEST="LTE BAND3",19300,"ON",50,1

Send AT command to force the module enter receive mode
lte_at "AT+QRXFTM=1,\"LTE BAND3\",1575,0,0,0"
lte_at "AT+QRXFTM=1,\"LTE BAND8\",3625,0,0,0"
lte_at "AT+QRXFTM=1,\"LTE BAND20\",6300,0,0,0"

enter module FTM mode.
lte_at AT+QRFTESTMODE=1

exit module FTM mode.
lte_at AT+QRFTESTMODE=0

to check if the testmode is active
lte_at AT+QRFTESTMODE? #return 1 = testmode active

to check if the mode is FTM (RF test mode)
lte_at AT+CFUN? #return 5 = testmode active

check firmware version
lte_at AT+QGMR

check hardware version
lte_at AT+CSUB