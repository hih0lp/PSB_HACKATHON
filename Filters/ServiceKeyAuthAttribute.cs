using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ERP_Proflipper_NotificationService.Filters
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class ServiceKeyAuthAttribute : Attribute, IAuthorizationFilter
    {
        private const string ServiceKeyHeader = "X-KEY"; //request header

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var configuration = context.HttpContext.RequestServices.GetService<IConfiguration>(); //getting service
            var expectedServiceKey = configuration["ServiceKey"]; //getting the key from request header

            if (string.IsNullOrEmpty(expectedServiceKey)) //checking
            {
                context.Result = new UnauthorizedObjectResult("Service key is not configure");
                return;
            }

            if (!context.HttpContext.Request.Headers.TryGetValue(ServiceKeyHeader, out var receivedKey))
            {
                context.Result = new UnauthorizedObjectResult("Service key is required");
                return;
            }

            if (!expectedServiceKey.Equals(receivedKey))
            {
                context.Result = new UnauthorizedObjectResult("Invalid received key");
                return;
            }
        }
    }
}
