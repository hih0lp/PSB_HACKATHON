using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using PSB_HACKATHON;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.NotificationHub;
using PSB_HACKATHON.Ports;
using PSB_HACKATHON.Services;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddControllers();


builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("https://psbsmartedu.ru", "https://www.psbsmartedu.ru")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials(); 
    });
});


builder.Services.AddDbContext<DB>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging();
}, ServiceLifetime.Scoped);

builder.Services.AddSignalR();


builder.Services.AddTransient<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<NotificationService>();


builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "PSB HACKATHON API",
        Description = "API для хакатона"
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


app.UseCors();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PSB HACKATHON API v1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();
app.UseAuthorization();

app.MapHub<NotificationsHub>("/notifications");

app.Run();