namespace WealthManager.Exceptions
{
    using System;

    /// <summary>
    /// a.
    /// </summary>
    public class ForbiddenException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ForbiddenException"/> class.
        /// </summary>
        /// <param name="description">description.</param>
        public ForbiddenException(string description)
            : base(description)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ForbiddenException"/> class.
        /// </summary>
        public ForbiddenException()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ForbiddenException"/> class.
        /// </summary>
        /// <param name="message">message.</param>
        /// <param name="innerException">innerException.</param>
        public ForbiddenException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}