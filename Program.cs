using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.OpenApi;
using PSB_HACKATHON;
using PSB_HACKATHON.Interfaces;
using PSB_HACKATHON.NotificationHub;
using PSB_HACKATHON.Ports;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<DB>(options =>
{
    options.UseNpgsql(connectionString);
    options.EnableSensitiveDataLogging();
}, ServiceLifetime.Scoped);
builder.Services.AddSignalR();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
//builder.Services.AddScoped<IHeaderRepository, HeaderRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "PSB HACKATHON API",
        Description = "API для образовательной платформы"
    });

    options.AddServer(new OpenApiServer
    {
        Url = "https://psbsmartedu.ru/",
        Description = "Production API"
    });
});
builder.Services.AddSwaggerGen();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseCors(p => p.AllowCredentials().AllowAnyHeader().AllowAnyMethod());//.WithOrigins("http://localhost:5173")

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();
app.UseAuthorization();
app.MapHub<NotificationsHub>("/notifications");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
