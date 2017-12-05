class Tools {
  creatDateArr (dateArr) {
    // if (!Array.isArray(dateArr) || dateArr.length !== 2) {
    //   return undefined
    // }
    const sTime = dateArr[0].getTime()
    const eTime = dateArr[1].getTime()
    console.log(sTime)
  }
}
const tools = new Tools()
tools.creatDateArr()
module.exports.tools = new Tools()
