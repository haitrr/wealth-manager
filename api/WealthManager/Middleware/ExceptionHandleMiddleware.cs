namespace WealthManager.Middleware
{
    using System;
    using System.Net;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Http;
    using WealthManager.Exceptions;
    using WealthManager.Models;

    public class ExceptionHandleMiddleware : IMiddleware
    {
        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            try
            {
                await next(context);
            }
            catch (BadRequestException exception)
            {
                await HandleBadRequestException(context, exception);
            }
            catch (ForbiddenException forbiddenException)
            {
                await HandleForbiddenException(context, forbiddenException);
            }
            catch (NotFoundException notFoundException)
            {
                await HandleNotFoundException(context, notFoundException);
            }
            catch (Exception e)
            {
                await HandleExceptionAsync(e, context);
                throw;
            }
        }

        private static Task HandleForbiddenException(HttpContext context, ForbiddenException forbiddenException)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;

            return context.Response.WriteAsync(JsonSerializer.Serialize(new ErrorDetails(forbiddenException.Message)));
        }

        private static Task HandleNotFoundException(HttpContext context, NotFoundException notFoundException)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;

            return context.Response.WriteAsync(JsonSerializer.Serialize(new ErrorDetails(notFoundException.Message)));
        }

        private static Task HandleExceptionAsync(Exception e, HttpContext context)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            Console.WriteLine(e.Message);
            Console.WriteLine(e.StackTrace);

            return context.Response.WriteAsync(JsonSerializer.Serialize(new ErrorDetails("Internal Server Error.")));
        }

        private static Task HandleBadRequestException(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            return context.Response.WriteAsync( JsonSerializer.Serialize(new ErrorDetails(exception.Message)));
        }
    }
}