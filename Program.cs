using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.OpenApi; 
using PSB_HACKATHON;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.NotificationHub;
using PSB_HACKATHON.Ports;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");


builder.Services.AddControllers();
builder.Services.AddCors();
builder.Services.AddDbContext<DB>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging();
}, ServiceLifetime.Scoped);

builder.Services.AddSignalR();
builder.Services.AddTransient<ICourseRepository, CourseRepository>();
//builder.Services.AddScoped<IHeaderRepository, HeaderRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "PSB HACKATHON API",
        Description = "API ��� ��������������� ���������"
    });

    options.AddServer(new OpenApiServer
    {
        Url = "https://psbsmartedu.ru/",
        Description = "Production API"
    });

    options.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
});



var app = builder.Build();


app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseCors(builder => builder
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowAnyOrigin());

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PSB HACKATHON API v1");
    c.RoutePrefix = "swagger"; 
});

app.MapControllers();
app.UseAuthorization();
app.MapHub<NotificationsHub>("/notifications");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
