// Libraries

const prompt = require("prompt-sync")();
var moment = require('moment');
var Holidays = require('date-holidays')
var hd = new Holidays('US') // Holidays in the USA
// Goal: Determine the first available due date following the funding of a loan
// Parameters:
// payDate is 10 days in the future from fundDay
// Due date is based on paySpan unless date be adjusted due to params
// Params:
// // // Weekend + 1 = Going forward
// // // Holiday - 1 = Going backward

// Class Properties purpose
// fundDay: Day loan was funded
// holidays: An array of dates containing holidays
// paySpan: A string representing when the customer is paid (weekly, bi-weekly, monthly)
// payDay: Contain one of the customer's pay days
// hasDirectDeposit: A boolean determining if the customer receives their payCheck via direct deposit

// Class function purpose
// calculateDueDate: return dueDate
class PayDateCalculator{

    // Initialization of Values
    constructor() {
        this.fundDay = moment(new Date());  
        this.holidays = hd.getHolidays(new Date().getFullYear()) 
        this.paySpan = ""
        this.startFund = 0
        this.payDay =  moment(new Date()); 
        this.hasDirectDeposit = false
        this.date = moment(new Date())
    }

    // Setters & Getters

    // Get the users fund date
    getFundDay(){
        return this.fundDay
    }

    // Sets the Users fund date
    setFundDay(fundDay){

        this.date.set({'month': fundDay.substring(0,2) - 1, 'date': fundDay.substring(3,5), "year": fundDay.substring(6,10)});
        
        this.fundDay.set({'month': fundDay.substring(0,2) - 1, 'date': fundDay.substring(3,5), "year": fundDay.substring(6,10)});
        console.log("Fund Day: ", this.fundDay.format("L"))
    }
    
    // Gets the Users pay span - frequency in which the user paid by their employer
    getPaySpan(){
        return this.paySpan
    }

    // Sets the User pay span
    setPaySpan(paySpan){
        this.paySpan = paySpan
    }
    
    // Gets the User Due Dates
    getPayDay(){
        return this.payDay
    }

    // Sets the User Due Date for Payment - Initial
    setPayDay(){
        if (this.getPaySpan() == "weekly"){
            // User is paid weekly = 7 days after fund date
            this.payDay = this.date.add(7, "days")
        }
        else if(this.getPaySpan() == "bi-weekly"){
            // User is paid bi-weekly = 14 days after fund date
            this.payDay = this.date.add(14, "days")
        }
        else if(this.getPaySpan() == "monthly"){
            // User is paid monthly =  month after fund date
            this.payDay = this.date.add(1, "month")
        }
        // this.date = this.payDay
        console.log("Pay Date: ", this.payDay.format("L")) // current due date
    }

    // Get value determining if User has or doesn't have Direct Deposit
    getHasDirectDeposit(){
        return this.hasDirectDeposit
    }

    // Set the value for whether or not the User has or does not have Direct Deposit
    setHasDirectDeposit(directDeposit){
        if (directDeposit == "yes" || directDeposit == "y"){
            this.hasDirectDeposit = true
            console.log("User has Direct Deposit")
        }else{
            this.hasDirectDeposit = false
            this.payDay.add(1, "days")
            console.log("User does not have Direct Deposit - Added a Day")
        }
    }

    // End of Setters & Getters

    // Did not use this function
    calculateDueDate(fundDay, holidays, paySpan, payDay, hasDirectDeposit){}

    // Checks if the due date is the Weekend
    isWeekend(){
        if (this.payDay.weekday() == 0 || this.payDay.weekday() == 6){
            return true
        }else{
            return false
        }
    }

    // If the current due date is on the Weekend, a day is Added
    weekendCalc(){
        // is the weekend
        this.payDay.add(1, "days")
        console.log("Weekend Calc - Added a day: ", this.payDay.format("L"))
    }

    // Check if the current due date is a Holiday
    isAHoliday(){
        var s = hd.isHoliday(this.payDay)
        if (s){
            return true
        }else{
            return false
        }
    }
    
    // If the current due date is on a Holiday, a day is substracted 
    // However, if the day prior of that Holiday is the Weekend, we add until there isn't anymore Holidays moving forward
    // Example - Adding Process
    // - December 24 = Monday
    // - December 23 = Sunday
    // - Therefore, we add to get December 25 = Tuesday (Another Holiday)
    // - Therefore, we add again to get December 26 = Wednesday (Not a Holiday)
    // - Example Due Date = Decemeber 26
    holidayCalc(){
        // is the holiday
        this.payDay.subtract(1, "days") // subtracts a day

        console.log("Holiday Calc: ", this.payDay.format("L"))

        // Push due date forward, Due to the prior initial date is the Weekend
        if (this.payDay.weekday() == 0 || this.payDay.weekday() == 6){
            this.payDay.add(1, "days")  // Going back to initial value due to Day before being the Weekend
            while (hd.isHoliday(this.payDay)){
                console.log("Holiday Calc: Holiday was on Monday initially - Adding instead of Substracting")
                this.payDay.add(1, "days")  // adding a day instead of going forward - Edge case - prevents infinte loop
            }
        }
        // console.log("TempDate - After: ", tempDate)
    }

    // Checks the Weekend and Holiday Dates & call their Calculators
    weekEndHolidayLoop(){
        while (this.isWeekend()){
            this.weekendCalc()
        }
        while(this.isAHoliday()){
            this.holidayCalc()
            this.weekEndHolidayLoop()
        }
    }

    // Checks to see if the Ending result Due Date is Beyond on at the Day of the FUND DATE + 10
    officialDueDateIsGood(){
        console.log("Fund Day: ", this.fundDay.format("L"))
        console.log("Pay Date: ", this.payDay.format("L"))

        var date_ = this.fundDay.add(10, "days") // changes the fund date
        console.log("Fund Date + 10 days: ", date_.format("L"))

        var dateDiff = this.payDay.diff(date_, "days") // if positive, then good
        if (dateDiff >= 0) { 
            this.fundDay.subtract(10, "days") // Set fund day back to original value
            return true
        }else{
            this.fundDay.subtract(10, "days") // Set fund day back to original value
            return false
        }
    }
    // Restart the Due Date process if the Current Due Date is below the Value of (Fund Date + 10)
    nextFundDate(){
        this.setPayDay()

        var directDeposit = this.getHasDirectDeposit()

        // Adding another day if Direct Deposit is not there
        if (directDeposit == true){
            this.setHasDirectDeposit("yes")
        }else{
            this.setHasDirectDeposit("no")
        }
        this.weekEndHolidayLoop()
    }

    // Validates the User's Date String input
    isValidDate(dateString){
        // First check for the pattern
        if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString))
            return false;

        // Parse the date parts to integers
        var parts = dateString.split("/");
        var day = parseInt(parts[1], 10);
        var month = parseInt(parts[0], 10);
        var year = parseInt(parts[2], 10);

        // Check the ranges of month and year
        if(year < 1000 || year > 3000 || month == 0 || month > 12)
            return false;

        var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

        // Adjust for leap years
        if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
            monthLength[1] = 29;

        // Check the range of the day
        return day > 0 && day <= monthLength[month - 1];
    };

    // Validates the Users pay frequency input
    isValidPayFrequency(paySpan){
        if (paySpan == "weekly"){
            this.setPaySpan(paySpan)
            return true
        }
        else if(paySpan == "bi-weekly"){
            this.setPaySpan(paySpan)
            return true
        }
        else if(paySpan == "monthly"){
            this.setPaySpan(paySpan)
            return true
        }else{
            return false // invalid entry
        }
    }
}

// Funding Process - Start
function getFunding(){
    const pdc = new PayDateCalculator()

    // Step 1) Fund Day, Customer Pay Frequency, Present Due Date
    var paySpan = prompt("What is your paycheck frequency? (Format: weekly, bi-weekly, monthly) ").toLowerCase()

    while (!pdc.isValidPayFrequency(paySpan)){
        paySpan = prompt("Invalid entry. Try again (Format: weekly, bi-weekly, monthly) ").toLowerCase()
    }

    var fundDay = prompt("On what date would you like to be funded? (Format: MM/DD/YYYY) ")
    while(!pdc.isValidDate(fundDay)){
        fundDay = prompt("Fund date was entered improperly. Try again (Format: MM/DD/YYYY) ")
    }
    pdc.setFundDay(fundDay)
    pdc.setPayDay()

    // Step 2) Direct Deposit
    var directDeposit = prompt("Do you have direct deposit? (Yes or No) ").toLowerCase()
    pdc.setHasDirectDeposit(directDeposit)

    // Step 3) Due Date on Weekend, Holiday or Both
    pdc.weekEndHolidayLoop()

    // console.log(pdc.dueDate.format("L"))

    // Step 4) Due Date >= fund day + 10 days
    var od = pdc.officialDueDateIsGood()
    while(!od){
        console.log("\n") // adding space for next loop
        pdc.nextFundDate()
        od = pdc.officialDueDateIsGood()
    }
    console.log("Official Pay Due Date: ", pdc.getPayDay().format("L"))
}

getFunding();




