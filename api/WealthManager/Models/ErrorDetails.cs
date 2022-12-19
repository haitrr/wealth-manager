namespace WealthManager.Models
{
    public class ErrorDetails
    {
        public string Message { get; set; }
        public ErrorDetails(string exceptionMessage)
        {
            this.Message = exceptionMessage;
        }
    }
}