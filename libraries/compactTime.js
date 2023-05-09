import {
    mod
} from './misc.js'

// Compact date-time format, with years modulo 20
// Format is YDDTT where:
//     Y: Year, modulo 20
//     DD: Day of year in base 19-ish (has 20 symbols, sue me)
//     TT: Time of day in seconds, modulo 19*19
// Example: 
// fjstm decodes as Sun, 07 May 2023 18:16:00 GMT
// Error is within 6 minutes of exact time (day divided in blocks of 6 minutes)

export {
  dateTo19Encoding,
  from19EncodingToDate,
  intTo19Encoding,
  from19EncodingToInt,
  secsTo19x19Encoding,
  from19x19EncodingtoSecs,
  secsToTimeIsh
}

const abt = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z']

function dateTo19Encoding(date){
  const doy = (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())) 
  const eDoy = intTo19Encoding(doy)
  const year = date.getFullYear() % 20 
  const eYear = abt[year]
  const utcTimestamp = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds())
  const secs = (utcTimestamp - startOfDay) / 1000  
  const eSecs = intTo19Encoding(secsTo19x19Encoding(secs))
  return `${eYear}${eDoy.str}${eSecs.str}`
}

function from19EncodingToDate(ntn){
  const year = 2020+abt.indexOf(ntn[0])
  const doy = from19EncodingToInt(ntn.slice(1, 3)) - 1
  const secs = from19x19EncodingtoSecs(from19EncodingToInt(ntn.slice(3, 5)))
  let d = new Date(`${year}-01-01T00:00:00Z`)
  let t = d.getTime()
  let s = t + (doy * 86400 + secs) * 1000
  d.setTime(s)
  return d.toUTCString()
}

function intTo19Encoding(num){
  const rem = mod(num, 19)
  const div = (num / 19) << 0
  const str = `${abt[div]}${abt[rem]}`
  const nums = [div, rem]
  return {
    str: str,
    nums: nums
  }
}

function from19EncodingToInt(enc){
  const div = abt.indexOf(enc[0])
  const rem = abt.indexOf(enc[1])
  return div*19 + rem
}

function secsTo19x19Encoding(secs){
  return (secs / 240) << 0
}

function from19x19EncodingtoSecs(cmp){
  return cmp * 240
}

function secsToTimeIsh(secs){
  const hours = ((secs / 3600) << 0).toString().padStart(2, "0")
  const minutes = ((mod(secs, 3600) / 60) << 0).toString().padStart(2, "0")
  const seconds = (mod(secs, 60)).toString().padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}