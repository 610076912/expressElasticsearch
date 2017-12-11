var dateFormat = require('dateformat')
// todo 在分页完成后，将表格数据统计中的时间段改为elasticsearch创造空数据。
function creatDateArr (arr) {
  // const dateArr = JSON.parse(arr)
  const dateArr = arr
  if (!Array.isArray(dateArr) || dateArr.length !== 2) {
    return new Error('time_range字段错误')
  }
  // const sTime = new Date(dateArr[0]).getTime()
  // const eTime = new Date(dateArr[1]).getTime()
  const sTime = dateArr[0]
  const eTime = dateArr[1]
  const intervalTime = eTime - sTime
  const interDays = (intervalTime.toFixed(2) / 86400000)
  // console.log('-------------------------------------天数--------------------------------------')
  // console.log(interDays)

  const resultArr = []
  for (let i = 0; i < interDays; i++) {
    resultArr.push({
      day_time: dateFormat(sTime + 86400000 * i, 'isoDate'),
      pjclick: 0,
      play_count: 0,
      bg_count: 0,
      pjbg: 0,
      click_count: 0
    })
  }
  // console.log(resultArr)
  return resultArr
}

module.exports.creatDateArr = creatDateArr
