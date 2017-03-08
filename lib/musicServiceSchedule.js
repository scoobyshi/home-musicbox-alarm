var cronschedule = require('cron').CronJob;
var sqlite3 = require('sqlite3'); // Add .verbose for more info
var job;

function showSchedule(responsecb) {

  var db = new sqlite3.Database('./db/schedule.sqlite3');
  var scheduleDetail = [];
  var i = 0;

  db.all("SELECT id, playlistid, cron FROM playschedule", (err, rows) => {
    rows.forEach(function (row) {
      console.log(row.id, row.playlistid, row.cron);
      scheduleDetail[i] = row;
      i++;
    });

    // Return only the first alarm scheduled, for now
    responsecb.status(200).json({
      "id": scheduleDetail[0].id,
      "playlistid": scheduleDetail[0].playlistid,
      "cron": scheduleDetail[0].cron
    });

  });

  db.close();

}

function updateSchedule(playlistid, cron, responsecb) {

  var db = new sqlite3.Database('./db/schedule.sqlite3');
  var scheduleDetail = [];

  db.run("update playschedule set playlistid = ?, cron=" + cron + " where id=1;", playlistid);
  db.close();

  responsecb.status(200).json({ "message": "success" });

  console.log("Update Schedule Cron Start:" + JSON.parse(cron));

  // Query param should look like cron="00 15 21 * * *", with double quotes
  var nextcron = JSON.parse(cron);

  job.stop();
  job = new cronschedule({
    cronTime: nextcron,
    onTick: () => {
      this.load(playlistid, res => console.log("Response:", res));
      this.playback('play', res => console.log("Response:", res));
    },
    start: true,
    timeZone: 'America/Toronto'
  });

}

function autoSchedule() {

  var db = new sqlite3.Database('./db/schedule.sqlite3');
  var scheduleDetail = [];
  var i = 0;

  // db.get('SELECT * FROM playschedule WHERE id = ?', req.params.id);
  db.all("SELECT id, playlistid, cron FROM playschedule", (err, rows) => {
    rows.forEach(function (row) {
      console.log(row.id, row.playlistid, row.cron);
      scheduleDetail[i] = row;
      i++;
    });

    // myScheduleDate = new Date(scheduleDetail[0].startdatetime);

    var myScheduleCronStart = scheduleDetail[0].cron;
    // var myScheduleCronStart = '44 9 * * *';
    var myPlaylist = scheduleDetail[0].playlistid;
    // console.log("Date from DB: ", myScheduleDate, "Testing Local:", myScheduleDate.toLocaleString());
    console.log("Schedule Cron Start:", myScheduleCronStart);

    job = new cronschedule({
      cronTime: myScheduleCronStart,
      onTick: () => {
        this.load(myPlaylist, res => console.log("Response:", res));
        this.playback('play', res => console.log("Response:", res));
      },
      start: true,
      timeZone: 'America/Toronto'
    });

  });

  db.close();
}

module.exports.autoSchedule = autoSchedule;
module.exports.updateSchedule = updateSchedule;
module.exports.showSchedule = showSchedule;