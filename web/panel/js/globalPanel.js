/*
 * Copyright (C) 2017 phantombot.tv
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * @author IllusionaryOne
 */

/*
 * globalPanel.js
 * Drives queries and presentation on the index page.
 */
(function() {

    var streamOnline = false,
        whisperMode = false,
        responseMode = false,
        meMode = false,
        pauseMode = false;

    /*
     * @function onMessage
     * This event is generated by the connection (WebSocket) object.
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            if (panelCheckQuery(msgObject, 'global_panelStatsEnabled')) {
                if (panelMatch(msgObject['results']['enabled'], 'true')) {
                    if (!panelStatsEnabled) {
                        panelStatsEnabled = true;
                        doQuery(); // Run the query again to populate fields.
                    }
                } else {
                    $('#panelStatsEnabled').html('<span>Panelstatistiken sind deaktiviert.</span>');
                }
            }

            if (panelCheckQuery(msgObject, 'global_streamOnline')) {
                streamOnline = (panelMatch(msgObject['results']['streamOnline'], 'true'));
                if (streamOnline) {
                    $('#streamOnline').html('<span class="greenPill" data-toggle="tooltip" title="Stream Online"><i class="fa fa-twitch fa-lg" /></span>');
                  } else {
                    $('#streamOnline').html('');
                }
            }

            if (panelCheckQuery(msgObject, 'global_whisperMode')) {
                whisperMode = (panelMatch(msgObject['results']['whisperMode'], 'true'));
            }
            if (panelCheckQuery(msgObject, 'global_muteMode')) {
                responseMode = (panelMatch(msgObject['results']['response_@chat'], 'true'));
            }
            if (panelCheckQuery(msgObject, 'global_toggleMe')) {
                meMode = (panelMatch(msgObject['results']['response_action'], 'true'));
            }
            if (panelCheckQuery(msgObject, 'global_commandsPaused')) {
                $.globalPauseMode = (panelMatch(msgObject['results']['commandsPaused'], 'true'));
            }

            if (whisperMode) {
                $('#whisperModeStatus').html('<span class="purplePill" data-toggle="tooltip" title="Flüstermodus"><i class="fa fa-user-secret fa-lg" /></span>');
            } else {
                $('#whisperModeStatus').html('');
            }

            if (meMode) {
                $("#meModeStatus").html('<span class="purplePill" data-toggle="tooltip" title="Aktions-(/me) Modus"><i class="fa fa-hand-o-right fa-lg" /></span>');
            } else {
                $("#meModeStatus").html('');
            }
            if (!responseMode) {
                $("#muteModeStatus").html('<span class="redPill" data-toggle="tooltip" title="Lautlos-Modus"><i class="fa fa-microphone-slash fa-lg" /></span>');
            } else {
                $("#muteModeStatus").html('');
            }

            if ($.globalPauseMode) {
                $("#commandPauseStatus").html("<span class=\"redPill\" data-toggle=\"tooltip\" title=\"Befehle pausiert\"><i class=\"fa fa-pause-circle-o fa-lg\" /></span>");
            } else {
                $("#commandPauseStatus").html("");
            }

            if (streamOnline) {
                if (panelCheckQuery(msgObject, 'global_streamUptime')) {
                    $("#streamUptime").html("<span class=\"purplePill\" data-toggle=\"tooltip\" title=\"Onlinezeit\"><i class=\"fa fa-clock-o fa-lg\" /> " + msgObject['results']['streamUptime'] + "</span>");
                }
                if (panelCheckQuery(msgObject, 'global_playTime')) {
                    $("#timePlayed").html("<span class=\"purplePill\" data-toggle=\"tooltip\" title=\"Spielzeit\"><i class=\"fa fa-gamepad fa-lg\" /> " + msgObject['results']['playTime'] + "</span>");
                }
                if (panelCheckQuery(msgObject, 'global_viewerCount')) {
                    $("#viewerCount").html("<span class=\"purplePill\" data-toggle=\"tooltip\" title=\"ZuschauerInnen\"><i class=\"fa fa-users fa-lg\" /> " + msgObject['results']['viewerCount'] + "</span>");
                }
            } else {
                $("#streamUptime").html('');
                $("#timePlayed").html('');
                $("#viewerCount").html('');
            }

            if (panelCheckQuery(msgObject, 'global_dsToggle')) {
                if (msgObject['results']['timerToggle'] !== undefined && msgObject['results']['timerToggle'] !== null) {
                    if (panelMatch(msgObject['results']['timerToggle'], 'true')) {
                        $('#multiStatus').html('<span class="purplePill" data-toggle="tooltip" title="Multi-Link Aktiviert"><i class="fa fa-link fa-lg" /></span>');
                    } else {
                        $('#multiStatus').html('');
                    }
                }
            }

            if (panelCheckQuery(msgObject, 'global_newrelease_info')) {
                var release_info = msgObject['results']['newrelease_info'];
                if (msgObject['results']['newrelease_info'] !== undefined && msgObject['results']['newrelease_info'] !== null) {
                    var newVersionData = msgObject['results']['newrelease_info'].split('|'),
                        changeLog = 'https://github.com/PhantomBot/PhantomBot/releases/' + newVersionData[0];
                    $('#newVersionDialog').html('Version <b>' + newVersionData[0] + '</b> von PhantomBot steht jetzt zum Download bereit! Überprüfe das Änderungsprotokoll für Details!<br><br>' +
                                                '<b>Veröffentlichungs- Änderungsprotokoll:</b><br><a target="_blank" href="' + changeLog + '">' + changeLog + '</a><br><br>' +
                                                '<b>Download Link:</b><br><a target="_blank" href="' + newVersionData[1] + '">' + newVersionData[1] + '</a><br><br>');
                    $('#newVersionAvailable').html('<span class="yellowPill" data-toggle="tooltip" title="Neue Version verfügbar! Klicke für mehr Informationen."' +
                                                   'onclick="$(\'#newVersionDialog\').dialog(\'open\')">Neue Version!</span>');

                } else {
                    $('#newVersionAvailable').html('');
                }
            }

            $('[data-toggle="tooltip"]').tooltip();
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBQuery("global_newrelease_info", "settings", "newrelease_info");
        sendDBQuery("global_whisperMode", "settings", "whisperMode");
        sendDBQuery("global_muteMode", "settings", "response_@chat");
        sendDBQuery("global_toggleMe", "settings", "response_action");
        sendDBQuery("global_commandsPaused", "commandPause", "commandsPaused");
        sendDBQuery("global_dsToggle", "dualStreamCommand", "timerToggle");

        if (!panelStatsEnabled) {
            sendDBQuery("global_panelStatsEnabled", "panelstats", "enabled");
        } else {
            sendDBQuery("global_viewerCount", "panelstats", "viewerCount");
            sendDBQuery("global_streamOnline", "panelstats", "streamOnline");
            sendDBQuery("global_streamUptime", "panelstats", "streamUptime");
            sendDBQuery("global_playTime", "panelstats", "playTime");
        }
    }

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected) {
            doQuery();
            clearInterval(interval);
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 20 seconds for updates.
    setInterval(function() {
        if (isConnected) {
            doQuery();
        }
    }, 2e4);

    // Export functions - Needed when calling from HTML.
    $.globalOnMessage = onMessage;
    $.globalDoQuery = doQuery;
    $.globalPauseMode = pauseMode;
})();
