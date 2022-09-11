function timeConversion(duration) {
    let portions = [];

    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);
    if (hours > 0) {
        const nametime = (hours > 1) ? ' heures' : ' heure';
        portions.push(hours + nametime);
        duration = duration - (hours * msInHour);
    }

    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);
    if (minutes > 0) {
        const nametime = (minutes > 1) ? ' minutes' : ' minute';
        portions.push(minutes + nametime);
        duration = duration - (minutes * msInMinute);
    }
    else {
        const seconds = Math.trunc(duration / 1000);
        if (seconds > 0) {
            const nametime = (seconds > 1) ? ' seconds' : ' second';
            return portions = seconds + nametime;
        }
    }

    const seconds = Math.trunc(duration / 1000);
    if (seconds > 0) {
        const nametime = (seconds > 1) ? ' seconds' : ' second';
        portions.push(seconds + nametime);
    }


    return portions.join(' ');
}

module.exports = {timeConversion};